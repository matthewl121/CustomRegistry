import { Builder, By, until } from 'selenium-webdriver';
import assert from 'assert';


(async function testDownloadPackages() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Open the page where the DownloadPackages component is rendered
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Download Packages']")), 15000); // Adjust selector based on your DOM
        const downloadPackageLink = await driver.findElement(By.xpath("//h3[text()='Download Packages']"));

        // Click on "Download Package" to load the component
        await downloadPackageLink.click();

        // Check if the input fields and button are present
        const queryInput = await driver.findElement(By.css('input[placeholder="Package Query"]'));
        const versionInput = await driver.findElement(By.css('input[placeholder="Version"]'));
        const searchButton = await driver.findElement(By.css('button'));

        // Check if button and inputs are rendered
        assert(await queryInput.isDisplayed(), 'Package Query input should be displayed');
        assert(await versionInput.isDisplayed(), 'Version input should be displayed');
        assert(await searchButton.isDisplayed(), 'Search button should be displayed');

        // Test: Submit without entering any values (should show error)
        await searchButton.click();

        // Wait for the error message
        const errorMessage = await driver.wait(until.elementLocated(By.xpath("//strong[contains(text(),'Package query and version are required')]")), 5000);
        assert(await errorMessage.isDisplayed(), 'Error message should be displayed when fields are empty');

        // Test: Enter values and search for packages
        await queryInput.sendKeys('unlicensed');
        await versionInput.sendKeys('0.4.0');
        await searchButton.click();

        // Simulate a successful API response
        const packageList = await driver.wait(until.elementLocated(By.xpath("//h3[text()='Packages:']/following-sibling::ul")), 5000);

        // Verify that the package list is displayed
        assert(await packageList.isDisplayed(), 'Package list should be displayed after search');
        
        // Check if at least one package is displayed (modify according to your mock data)
        const packageItems = await packageList.findElements(By.tagName('li'));
        assert(packageItems.length > 0, 'At least one package should be displayed in the list');
        console.log('DownloadPackages test passed!');
    } catch (error) {
        console.error('DownloadPackages test failed:', error);
    } finally {
        await driver.quit();
    }
})();