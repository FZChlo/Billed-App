/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";

import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js";


import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      const iconActivated = windowIcon.classList.contains('active-icon')
      //to-do write expect expression


      //------ 5-1 -> Ajout de tests unitaires et d'intégration :  ------
      //EXPECT MANQUANT : 
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills }) // Affiche les données du fichier views/billsUI
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1) // Par ordre croissant
      const datesSorted = [...dates].sort(antiChrono) // Les dates sont triés par dates
      expect(dates).toEqual(datesSorted) // 1. On s'attend à ce que les données "dates" soit égal aux données "datesSorted"
    }); // Resolution du bug 1 sur le fichier views/billsUI ( fichier d'affichage des bills) ou il manquait la fonction de trie.
  });

  describe("When I am on Bills page with an error", () => {
    test("Then Error page should be displayed", () => {
        const html = BillsUI({ data: bills, error: true });
        document.body.innerHTML = html;
        const hasError = screen.getAllByText("Erreur");
        expect(hasError).toBeTruthy();
    });
});

describe("When I am on Bills page and it's loading", () => {
    test("Then Loading page should be displayed", () => {
        const html = BillsUI({ data: bills, loading: true });
        document.body.innerHTML = html;
        const isLoading = screen.getAllByText("Loading...");
        expect(isLoading).toBeTruthy();
    });
});

describe("When I click on the 'Nouvelle note de frais' button", () => {
    test("Then I should be sent on the new bill page", () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
        const mockBills = new Bills({ document, onNavigate, localStorage, store: null });
        const btnNewBill = screen.getByTestId('btn-new-bill');

        // Simulation de la fonction handleClick pour faire une nouvelle note de frais
        const mockFunctionHandleClick = jest.fn(mockBills.handleClickNewBill);
        btnNewBill.addEventListener('click', mockFunctionHandleClick)
        fireEvent.click(btnNewBill)
        expect(mockFunctionHandleClick).toHaveBeenCalled();
        expect(mockFunctionHandleClick).toHaveBeenCalledTimes(1);
    });
});

describe("When I click on first eye icon", () => {
    test("Then modal should open", () => {
        Object.defineProperty(window, localStorage, { value: localStorageMock })
        window.localStorage.setItem("user", JSON.stringify({ type: 'Employee' }))
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
        const billsContainer = new Bills({ document, onNavigate, localStorage: localStorageMock, store: null });
        $.fn.modal = jest.fn();

        const handleClickIconEye = jest.fn(() => { billsContainer.handleClickIconEye });
        const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
        firstEyeIcon.addEventListener("click", handleClickIconEye)
        fireEvent.click(firstEyeIcon)
        expect(handleClickIconEye).toHaveBeenCalled();
        expect($.fn.modal).toHaveBeenCalled();
    });
});
});
// 5.2-2 ->------- TESTS D'INTEGRATION AVEC "GET" -------
describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
      // Récupération des données de l'API
      test("fetches bills from mock API GET", async() => {
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          window.localStorage.setItem('user', JSON.stringify({
              type: 'Employee'
          }));

          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.append(root)
          router()
          onNavigate(ROUTES_PATH.Bills)

          const lastBill = await waitFor(() => screen.getByText('test2'))
          expect(lastBill).toBeTruthy()
      });
  });

  // Lorsqu'une erreur se produit sur l'API
  describe("When an error occurs on API", () => {
      // beforeEach() gère l'asynchrone
      // Jest.spyOn simule la fonction qu'on a besoin et conserve l'implémentation d'origine
      beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
      });

      // ERREUR 404 - erreur du contenu du site
      test("fetches bills from an API and fails with 404 message error", async() => {
          mockStore.bills.mockImplementationOnce(() => {
              return {
                  list: () => {
                      return Promise.reject(new Error("Erreur 404"))
                  }
              }
          });
          const html = BillsUI({ error: "Erreur 404" });
          document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
      });

      // ERREUR 500 - erreur de serveur
      test("fetches messages from an API and fails with 500 message error", async() => {
          mockStore.bills.mockImplementationOnce(() => {
              return {
                  list: () => {
                      return Promise.reject(new Error("Erreur 500"))
                  }
              }
          });
          const html = BillsUI({ error: "Erreur 500" });
          document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
      });
  });
});
