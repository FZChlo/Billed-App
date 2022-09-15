/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

    // 3-1 -> ------- TESTS UNITAIRES -------
    describe("Given I am connected as an employee", () => {
      describe("When I am on NewBill Page", () => {
          beforeEach(() => {
              Object.defineProperty(window, "localStorage", { value: localStorageMock, });
              window.localStorage.setItem("user", JSON.stringify({ type: "Employee", }));
              const root = document.createElement("div");
              root.setAttribute("id", "root");
              document.body.append(root);
              router();
              window.onNavigate(ROUTES_PATH.NewBill);
          });
  
          test("Then bill icon in vertical layout should be highlighted", async() => {
              await waitFor(() => screen.getByTestId("icon-mail"));
              const mailIcon = screen.getByTestId("icon-mail");
              expect(mailIcon.classList.contains("active-icon"));
          });
  
          describe("When a file is selected ", () => {
              test("Then selecting the right format should work", () => {
                  const onNavigate = (pathname) => {
                      document.body.innerHTML = ROUTES({ pathname });
                  };
  
                  const employeeNewBill = new NewBill({
                      document,
                      onNavigate,
                      store: mockStore,
                      localStorage: window.localStorage,
                  });
  
                  jest.spyOn(window, "alert").mockImplementation(() => {});
                  const fileInput = screen.getByTestId("file");
  
                  const handleChangeFile = jest.fn(employeeNewBill.handleChangeFile);
                  fileInput.addEventListener("change", (e) => handleChangeFile(e));
                  const file = new File(["test"], "test.png", { type: "image/png" });
                  userEvent.upload(fileInput, file);
                  expect(handleChangeFile).toHaveBeenCalled();
                  expect(window.alert).not.toHaveBeenCalled();
                  expect(fileInput.files[0]).toStrictEqual(file);
              });
  
              test("Then selecting wrong files should display an error alert", async() => {
                  const onNavigate = (pathname) => {
                      document.body.innerHTML = ROUTES({ pathname });
                  };
  
                  const employeeNewBill = new NewBill({
                      document,
                      onNavigate,
                      store: mockStore,
                      localStorage: window.localStorage,
                  });
  
                  jest.spyOn(window, "alert").mockImplementation(() => {});
                  const fileInput = screen.getByTestId("file");
  
                  const handleChangeFile = jest.fn(employeeNewBill.handleChangeFile);
                  fileInput.addEventListener("change", (e) => handleChangeFile(e));
                  const file = new File(["test"], "test.pdf", { type: "image/pdf" });
                  userEvent.upload(fileInput, file);
                  expect(handleChangeFile).toHaveBeenCalled();
                  expect(window.alert).toHaveBeenCalled();
              });
          });
      });
  });


//3-2 -> --------Test d'intégration POST --------
describe("Given I am a user connected as Employee", () => {
  describe("When I submit the form completed", () => {
      test("Then the bill is created", async() => {
          document.body.innerHTML = NewBillUI();

          const onNavigate = (pathname) => {
              document.body.innerHTML = ROUTES({ pathname });
          };

          Object.defineProperty(window, "localStorage", {
              value: localStorageMock,
          });
          window.localStorage.setItem(
              "user",
              JSON.stringify({
                  type: "Employee",
                  email: "a@a",
              })
          );

          const newBill = new NewBill({
              document,
              onNavigate,
              store: null,
              localStorage: window.localStorage,
          });

          const mockBill = {
              type: "Transports",
              name: "Vol de Test",
              date: "2022-08-08",
              amount: 300,
              vat: 80,
              pct: 20,
              commentary: "Comment",
              fileUrl: "../img/test.png",
              fileName: "test.png",
              status: "pending",
          };

          // Load the values in the form
          screen.getByTestId("expense-type").value = mockBill.type;
          screen.getByTestId("expense-name").value = mockBill.name;
          screen.getByTestId("datepicker").value = mockBill.date;
          screen.getByTestId("amount").value = mockBill.amount;
          screen.getByTestId("vat").value = mockBill.vat;
          screen.getByTestId("pct").value = mockBill.pct;
          screen.getByTestId("commentary").value = mockBill.commentary;

          newBill.fileName = mockBill.fileName;
          newBill.fileUrl = mockBill.fileUrl;

          newBill.updateBill = jest.fn();
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

          const form = screen.getByTestId("form-new-bill");
          form.addEventListener("submit", handleSubmit);
          fireEvent.submit(form);

          expect(handleSubmit).toHaveBeenCalled();
          expect(newBill.updateBill).toHaveBeenCalled();
      });

      // TEST - Erreur 500
      describe("When an error occurs on API", () => {
          test("fetches error from an API and fails with 500 error", async() => {
              jest.spyOn(mockStore, "bills");
              jest.spyOn(console, "error").mockImplementation(() => {});

              Object.defineProperty(window, "localStorage", {
                  value: localStorageMock,
              });
              Object.defineProperty(window, "location", {
                  value: { hash: ROUTES_PATH["NewBill"] },
              });

              window.localStorage.setItem(
                  "user",
                  JSON.stringify({ type: "Employee" })
              );
              document.body.innerHTML = `<div id="root"></div>`;
              router();

              const onNavigate = (pathname) => {
                  document.body.innerHTML = ROUTES({ pathname });
              };

              mockStore.bills.mockImplementationOnce(() => {
                  return {
                      update: () => {
                          return Promise.reject(new Error("Erreur 500"));
                      },
                  };
              });
              const newBill = new NewBill({
                  document,
                  onNavigate,
                  store: mockStore,
                  localStorage: window.localStorage,
              });


              const form = screen.getByTestId("form-new-bill");
              const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
              form.addEventListener("submit", handleSubmit);
              fireEvent.submit(form);
              await new Promise(process.nextTick);
              expect(console.error).toHaveBeenCalled();
          });
      });
  });
});