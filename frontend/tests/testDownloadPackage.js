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

        // Click the download button
        const downloadButton = await driver.findElement(By.css('button'));
        await downloadButton.click();

        // Wait for metadata and file content to appear
        await driver.wait(until.elementLocated(By.css('pre')), 15000);  // Wait for the metadata to appear

        // Check if metadata is displayed
        const metadataElement = await driver.findElement(By.xpath("//h3[text()='Package Metadata:']/following-sibling::pre"));
        const metadataText = await metadataElement.getText();
        const normalizedMetadataText = metadataText.replace(/\s+/g, ' ').trim();
        assert(normalizedMetadataText.includes('Version'), 'Metadata should be displayed.');

        // Check if file content is displayed (content is truncated, check part of it)
        const fileContentElement = await driver.findElement(By.xpath("//h3[text()='Package Data:']/following-sibling::pre"));
        const fileContentText = await fileContentElement.getText();
        assert(fileContentText.length > 0, 'File content should be displayed.');

        console.log('DownloadPackage test passed!');
    } catch (error) {
        console.error('DownloadPackage test failed:', error);
    } finally {
        // Clean up and close the browser
        await driver.quit();
    }
})();
