import { Builder, By, until } from 'selenium-webdriver';

const testPackageRating = async () => {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Rate Package']")), 15000); // Adjust selector based on your DOM
        const ratePackageLink = await driver.findElement(By.xpath("//h3[text()='Rate Package']"));

        await ratePackageLink.click();
        // Wait for the page to load and input field to become interactable
        const packageIdInput = await driver.wait(
            until.elementLocated(By.xpath("//input[@placeholder='Enter Package ID']")),
            10000
        );
        await driver.wait(until.elementIsVisible(packageIdInput), 10000);

        // Enter a package ID
        const testPackageId = 'unlicensed--0.4.0';
        await packageIdInput.sendKeys(testPackageId);

        // Locate and click the "Get Rating" button
        await driver.findElement(By.xpath("//button[text()='Get Rating']"));
        // complete
        console.log('PackageRating test passed!');
    } catch (error) {
        console.error('PackageRating test failed:', error.message);
    } finally {
        await driver.quit();
    }
};

// Run the test
testPackageRating();
