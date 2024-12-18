import { Builder, By, until } from 'selenium-webdriver';
import assert from 'assert';

(async function testDownloadPackageRegex() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Open the page where the Home component is rendered
        await driver.get('http://localhost:3000');  // Replace with your app URL

        // Wait for the "Download Package by Regular Expression" text to be clickable
        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Download Package Regex']")), 15000);
        const downloadPackageLink = await driver.findElement(By.xpath("//h3[text()='Download Package Regex']"));

        // Click on "Download Package by Regular Expression" to load the component
        await downloadPackageLink.click();

        // Check if the input field and button are present
        const regexInput = await driver.findElement(By.css('input[placeholder="Enter Regular Expression"]'));
        const searchButton = await driver.findElement(By.css('button'));

        // Check if button and input field are rendered
        assert(await regexInput.isDisplayed(), 'Regular Expression input should be displayed');
        assert(await searchButton.isDisplayed(), 'Search Packages button should be displayed');

        // Test: Submit without entering any values (should show error)
        await searchButton.click();

        // Wait for the error message
        const errorMessage = await driver.wait(until.elementLocated(By.xpath("//strong[contains(text(),'Regular Expression is required.')]")), 5000);
        assert(await errorMessage.isDisplayed(), 'Error message should be displayed when regular expression is empty');

        // Test: Enter a valid regular expression and search for packages
        await regexInput.sendKeys('unlicensed');

        // complete
        console.log('DownloadPackageByRegex test passed!');
    } catch (error) {
        console.error('DownloadPackageByRegex test failed:', error);
    } finally {
        await driver.quit();
    }
})();
