import { Builder, By, until } from 'selenium-webdriver';
import assert from 'assert';

(async function testDownloadPackage() {
    // Initialize the WebDriver
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Open the page where Home component is rendered
        await driver.get('http://localhost:3000');  // Replace with your app URL

        // Wait for the "Download Package" text to be clickable
        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Download Package']")), 15000); // Adjust selector based on your DOM
        const downloadPackageLink = await driver.findElement(By.xpath("//h3[text()='Download Package']"));

        // Click on "Download Package" to load the component
        await downloadPackageLink.click();

        // Wait for the DownloadPackage component to appear by checking if the button is visible
        await driver.wait(until.elementLocated(By.css('button')), 15000);  // Wait for the button to appear

        // Fill in the package name and version inputs
        const packageNameInput = await driver.findElement(By.css('input[placeholder="Package Name"]'));
        await packageNameInput.sendKeys('unlicensed');

        const versionInput = await driver.findElement(By.css('input[placeholder="Version"]'));
        await versionInput.sendKeys('0.4.0');

        // Find the download button
        await driver.findElement(By.css('button'));

        // test complete
        console.log('DownloadPackage test passed!');
    } catch (error) {
        console.error('DownloadPackage test failed:', error);
    } finally {
        // Clean up and close the browser
        await driver.quit();
    }
})();
