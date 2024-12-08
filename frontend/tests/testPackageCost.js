import { Builder, By, until } from 'selenium-webdriver';

const testPackageCost = async () => {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Package Cost']")), 15000); // Adjust selector based on your DOM
        const ratePackageLink = await driver.findElement(By.xpath("//h3[text()='Package Cost']"));

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

        // Locate and toggle the "Include Dependencies" checkbox
        const includeDependenciesCheckbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
        const isChecked = await includeDependenciesCheckbox.isSelected();
        if (!isChecked) {
            await includeDependenciesCheckbox.click();
        }

        // Locate and click the "Get Cost" button
        await driver.findElement(By.xpath("//button[text()='Get Cost']"));
        // complete
        console.log('PackageCost test passed!');
    } catch (error) {
        console.error('PackageCost test failed:', error.message);
    } finally {
        await driver.quit();
    }
};

// Run the test
testPackageCost();
