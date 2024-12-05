import { Builder, By, until } from 'selenium-webdriver';
import assert from 'assert';

(async function testUploadPackage() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Open the page where the UploadPackage component is rendered
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Upload Package']")), 15000); // Adjust selector based on your DOM
        const uploadPackageLink = await driver.findElement(By.xpath("//h3[text()='Upload Package']"));

        await uploadPackageLink.click();

        // Test: Switch to "Upload by URL" mode
        const uploadByUrlButton = await driver.findElement(By.xpath("//button[text()='Upload by URL']"));
        await uploadByUrlButton.click();

        // Verify if the URL input is displayed
        const urlInput = await driver.findElement(By.css('input[placeholder="Enter npm URL"]'));
        assert(await urlInput.isDisplayed(), 'URL input should be displayed when "Upload by URL" is selected');

        // Test: Try to upload without entering URL (should show error)
        const uploadButton = await driver.findElement(By.xpath("//button[text()='Upload']"));
        await uploadButton.click();

        // Wait for and verify the error message
        const errorMessage = await driver.wait(until.elementLocated(By.xpath("//strong[contains(text(),'URL must be provided')]")), 5000);
        assert(await errorMessage.isDisplayed(), 'Error message should be displayed when URL is empty');

        // Test: Fill in URL and JSProgram, then upload
        await urlInput.sendKeys('https://npmjs.com/package/unlicensed');
        var jsProgramInput = await driver.findElement(By.css('textarea[placeholder="Enter JSProgram"]'));
        await jsProgramInput.sendKeys('console.log("Test JS Program")');
        await uploadButton.click();

        // Simulate successful upload and verify metadata display
        const metadataSection = await driver.wait(until.elementLocated(By.xpath("//h3[text()='Upload Successful!']")), 5000);
        assert(await metadataSection.isDisplayed(), 'Metadata section should be displayed after successful upload');

        // Test: Switch to "Upload by Content" mode
        const uploadByContentButton = await driver.findElement(By.xpath("//button[text()='Upload by Content']"));
        await uploadByContentButton.click();

        // Verify the file input is displayed
        const fileInput = await driver.findElement(By.css('input[type="file"]'));
        assert(await fileInput.isDisplayed(), 'File input should be displayed when "Upload by Content" is selected');

        // Fill in file input, package name, and JSProgram, then upload
        await fileInput.sendKeys('C:/Users/Aidan/Downloads/spec.yaml');  // Adjust to point to an actual file
        const packageNameInput = await driver.findElement(By.css('input[placeholder="Enter package name"]'));
        await packageNameInput.sendKeys('spec');
        jsProgramInput = await driver.findElement(By.css('textarea[placeholder="Enter JSProgram"]'));
        await jsProgramInput.sendKeys('console.log("Test JS Program")');
        await uploadButton.click();

        // Simulate successful upload and verify metadata display
        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Upload Successful!']")), 5000);
        const successMessage = await driver.findElement(By.xpath("//h3[text()='Upload Successful!']"));
        assert(await successMessage.isDisplayed(), 'Success message should be displayed after content upload');

        // Verify metadata fields (Name, Version, ID)
        const metadataName = await driver.findElement(By.xpath("//strong[contains(text(),'Name:')]"));
        assert(await metadataName.isDisplayed(), 'Metadata Name should be displayed');
        const metadataVersion = await driver.findElement(By.xpath("//strong[contains(text(),'Version:')]"));
        assert(await metadataVersion.isDisplayed(), 'Metadata Version should be displayed');
        const metadataId = await driver.findElement(By.xpath("//strong[contains(text(),'ID:')]"));
        assert(await metadataId.isDisplayed(), 'Metadata ID should be displayed');

        console.log('UploadPackage test passed!');
    } catch (error) {
        console.error('UploadPackage test failed:', error);
    } finally {
        await driver.quit();
    }
})();
