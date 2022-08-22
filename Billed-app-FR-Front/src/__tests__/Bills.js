/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills }) // Affiche les données du fichier views/billsUI
      const dates = screen.getAllByText(/^([1-9]|[12][0-9]|3[01])[ ]\b.{3}\b[.][ ]\d{2}$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1) // Par ordre croissant
      const datesSorted = [...dates].sort(antiChrono) // Les dates sont triés par dates
      expect(dates).toEqual(datesSorted) // 1. On s'attend à ce que les données "dates" soit égal aux données "datesSorted"
    }) // Resolution du bug 1 sur le fichier views/billsUI ( fichier d'affichage des bills) ou il manquait la fonction de trie.
  })
})
