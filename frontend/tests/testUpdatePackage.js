import { Builder, By, Key, until } from 'selenium-webdriver';
import assert from 'assert';

const testUpdatePackage = async () => {
    // Create a new WebDriver instance for Chrome
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Update Package']")), 15000); // Adjust selector based on your DOM
        const updatePackageLink = await driver.findElement(By.xpath("//h3[text()='Update Package']"));

        await updatePackageLink.click();

        // Test URL update mode
        const urlButton = await driver.findElement(By.xpath("//button[contains(text(),'Update by URL')]"));
        await urlButton.click();

        const urlInput = await driver.findElement(By.xpath("//input[@placeholder='Enter package URL']"));
        await urlInput.sendKeys('https://www.npmjs.com/package/unlicensed');

        const versionInput = await driver.findElement(By.xpath("//input[@placeholder='Enter new version (e.g., 2.3.0)']"));
        await versionInput.sendKeys('1.1.0');

        const packageIdInput = await driver.findElement(By.xpath("//input[@placeholder='Package ID']"));
        await packageIdInput.sendKeys('unlicensed--0.4.0')

        const updateButton = await driver.findElement(By.xpath("//button[text()='Update']"));

        // Test Content update mode
        const contentButton = await driver.findElement(By.xpath("//button[contains(text(),'Update by Content')]"));
        await contentButton.click();

        const packageNameInput = await driver.findElement(By.xpath("//input[@placeholder='Enter package name']"));
        await packageNameInput.sendKeys('spec2.0');

        const fileInput = await driver.findElement(By.xpath("//input[@type='file']"));
        await fileInput.sendKeys('C:/Users/Aidan/Downloads/spec.yaml'); // Replace with an actual file path

        const debloatCheckbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
        await debloatCheckbox.click();

        // Repeat version input and submit
        await versionInput.clear();
        await versionInput.sendKeys('2.0.0');

        // complete
        console.log('UpdatePackage test passed!');
    } catch (error) {
        console.error('UpdatePackage test failed:', error.message);
    } finally {
        // Quit the WebDriver instance
        await driver.quit();
    }
};

// Run the test
testUpdatePackage();
