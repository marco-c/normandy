"use strict";

Cu.import("resource://shield-recipe-client-content/AboutPages.jsm", this);

function withAboutStudies(testFunc) {
  return async (...args) => (
    BrowserTestUtils.withNewTab("about:studies", async browser => (
      testFunc(...args, browser)
    ))
  );
}

compose_task(
  withAboutStudies,
  async function testAboutStudiesWorks(browser) {
    ok(browser.contentDocument.getElementById("app"), "App element was found");
  }
);

compose_task(
  withPrefEnv({
    set: [["extensions.shield-recipe-client.shieldLearnMoreUrl", "http://test/%OS%/"]],
  }),
  withAboutStudies,
  async function testLearnMore(browser) {
    ContentTask.spawn(browser, null, () => {
      content.document.getElementById("shield-studies-learn-more").click();
    });
    await BrowserTestUtils.waitForLocationChange(gBrowser);

    const location = browser.currentURI.spec;
    is(
      location,
      AboutPages.aboutStudies.getShieldLearnMoreHref(),
      "Clicking Learn More opens the correct page on SUMO.",
    );
    ok(!location.includes("%OS%"), "The Learn More URL is formatted.");
  }
);

compose_task(
  withPrefEnv({
    set: [["browser.preferences.useOldOrganization", false]],
  }),
  withAboutStudies,
  async function testUpdatePreferencesNewOrganization(browser) {
    ContentTask.spawn(browser, null, () => {
      content.document.getElementById("shield-studies-update-preferences").click();
    });
    await BrowserTestUtils.waitForLocationChange(gBrowser);

    is(
      browser.currentURI.spec,
      "about:preferences#privacy-reports",
      "Clicking Update Preferences opens the privacy section of the new about:prefernces.",
    );
  }
);

compose_task(
  withPrefEnv({
    set: [["browser.preferences.useOldOrganization", true]],
  }),
  withAboutStudies,
  async function testUpdatePreferencesOldOrganization(browser) {
    // We have to use gBrowser instead of browser in most spots since we're
    // dealing with a new tab outside of the about:studies tab.
    const tab = await BrowserTestUtils.switchTab(gBrowser, () => {
      ContentTask.spawn(browser, null, () => {
        content.document.getElementById("shield-studies-update-preferences").click();
      });
    });

    if (gBrowser.contentDocument.readyState !== "complete") {
      await BrowserTestUtils.waitForEvent(gBrowser.contentWindow, "load");
    }

    const location = gBrowser.contentWindow.location.href;
    is(
      location,
      "about:preferences#advanced",
      "Clicking Update Preferences opens the advanced section of the old about:prefernces.",
    );

    const dataChoicesTab = gBrowser.contentDocument.getElementById("dataChoicesTab");
    ok(
      dataChoicesTab.selected,
      "Click Update preferences selects the Data Choices tab in the old about:preferences."
    );

    await BrowserTestUtils.removeTab(tab);
  }
);

compose_task(
  withStudyStorage,
  async function testStudyListing(storage) {
    // Sort order should be study3, study1, study2 (order by enabled, then most recent).
    const study1 = studyFactory({
      name: "A Fake Study",
      active: true,
      description: "A fake description",
      studyStartDate: new Date(2017).toJSON(),
    });
    const study2 = studyFactory({
      name: "B Fake Study",
      active: false,
      description: "A fake description",
      studyStartDate: new Date(2019).toJSON(),
    });
    const study3 = studyFactory({
      name: "C Fake Study",
      active: true,
      description: "A fake description",
      studyStartDate: new Date(2018).toJSON(),
    });

    await storage.create(study1);
    await storage.create(study2);
    await storage.create(study3);

    await BrowserTestUtils.withNewTab("about:studies", async browser => {
      await ContentTask.spawn(browser, [study1, study2, study3], async ([cStudy1, cStudy2, cStudy3]) => {
        const doc = content.document;

        function getStudyRow(docElem, studyName) {
          return docElem.querySelector(`.study[data-study-name="${studyName}"]`);
        }

        await ContentTaskUtils.waitForCondition(() => doc.querySelectorAll(".study-list .study").length);
        const studyRows = doc.querySelectorAll(".study-list .study");

        const names = Array.from(studyRows).map(row => row.querySelector(".study-name").textContent);
        Assert.deepEqual(
          names,
          [cStudy3.name, cStudy1.name, cStudy2.name],
          "Studies are sorted first by enabled status, and then by descending start date."
        );

        const study1Row = getStudyRow(doc, cStudy1.name);
        ok(
          study1Row.querySelector(".study-description").textContent.includes(cStudy1.description),
          "Study descriptions are shown in about:studies."
        );
        is(
          study1Row.querySelector(".study-status").textContent,
          "Active",
          "Active studies show an 'Active' indicator."
        );
        ok(
          study1Row.querySelector(".remove-button"),
          "Active studies show a remove button"
        );
        is(
          study1Row.querySelector(".study-icon").textContent.toLowerCase(),
          "a",
          "Study icons use the first letter of the study name."
        );

        const study2Row = getStudyRow(doc, cStudy2.name);
        is(
          study2Row.querySelector(".study-status").textContent,
          "Complete",
          "Inactive studies are marked as complete."
        );
        ok(
          !study2Row.querySelector(".remove-button"),
          "Inactive studies do not show a remove button"
        );

        study1Row.querySelector(".remove-button").click();
        await ContentTaskUtils.waitForCondition(() => (
          getStudyRow(doc, cStudy1.name).matches(".disabled")
        ));
        ok(
          getStudyRow(doc, cStudy1.name).matches(".disabled"),
          "Clicking the remove button updates the UI to show that the study has been disabled."
        );
      });

      const updatedStudy1 = await storage.get(study1.name);
      ok(
        !updatedStudy1.active,
        "Clicking the remove button marks the study as inactive in storage."
      );
    });
  }
);
