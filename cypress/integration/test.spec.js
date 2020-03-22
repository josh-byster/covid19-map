/// <reference types="Cypress" />
beforeEach(() => {
  cy.visit("http://localhost:8080");
});
describe("Smoke Test", function() {
  it("Has correct features on the page", function() {
    cy.get("#title").should("have.text", "COVID-19");

    cy.get("#animate").should("have.text", "Animate");

    cy.get(".track-overlay").should("be.visible");

    cy.get(".tooltip").should("not.be.visible");
  });

  it("Loads the current date", function() {
    cy.get("#panel-date").should("contain.text", "/20");
  });

  it("Has a non-zero confirmed count", function() {
    cy.get("#panel-deaths").scrollIntoView();
    cy.get("#panel-confirmed")
      .should("be.visible")
      .and("not.have.text", 0);
    cy.get("#panel-deaths")
      .should("be.visible")
      .and("not.have.text", 0);
    cy.get("#panel-active")
      .should("be.visible")
      .and("not.have.text", 0);
    cy.get("#panel-recovered")
      .should("be.visible")
      .and("not.have.text", 0);
  });

  it("Panel displays non-zero values", function() {
    cy.get("#panel-confirmed")
      .should("contain.text", "k")
      .and("not.have.text", "0");
  });
  it("Can click on timeline", function() {
    cy.get("circle").should("have.length.greaterThan", 0);
    cy.get("body").click(400, 560);

    cy.get(".label").should("have.text", "Jan 22");
  });

  it("Can use arrow keys to move timeline", function() {
    cy.get(".label").should("be.visible");
    cy.get("body").type("{rightarrow}");
    cy.get(".label").should("have.text", "Jan 22");

    cy.get("body").type("{rightarrow}{rightarrow}{leftarrow}{rightarrow}");
    cy.get(".label").should("have.text", "Jan 24");
  });

  it("Can animate", function() {
    cy.get("#animate").click();
    cy.get("#animate").should("have.text", "Stop");
    cy.get("#animate").click();
    cy.get("#animate").should("have.text", "Animate");
  });

  it("Tooltip works as expected", function() {
    cy.get("circle").should("have.length.greaterThan", 0);
    cy.get(".tooltip").should("not.be.visible");
    cy.wait(2500);
    cy.get("body").click(595, 240);

    cy.get(".tooltip")
      .should("be.visible")
      .and("contain.text", "Spain")
      .and("contain.text", "Total")
      .and("contain.text", "Active")
      .and("contain.text", "Recovered")
      .and("contain.text", "Deaths");

    cy.get("body").click(200, 200);
    cy.get(".tooltip").should("have.css", "opacity", "0");
  });

  it("Changing timeline also changes panel display", function() {
    cy.get(".label").should("be.visible");
    cy.get("body").type("{rightarrow}");
    cy.get("#panel-confirmed").should("have.text", "~555");
  });

  it.only("Changing timeline also changes tooltip display", function() {
    cy.get("circle").should("have.length.greaterThan", 0);
    cy.get(".tooltip").should("not.be.visible");
    cy.wait(2500);
    cy.get("body").click(595, 240);

    cy.get(".tooltip")
      .should("be.visible")
      .and("contain.text", "Active:")
      .and("not.contain.text", "Active: 0");

    cy.get("body").type("{rightarrow}");

    cy.get(".tooltip").should("contain.text", "Active: 0");

    cy.get("body").type("{leftarrow}");

    cy.get(".tooltip")
      .should("be.visible")
      .and("not.contain.text", "Active: 0");
  });
});
