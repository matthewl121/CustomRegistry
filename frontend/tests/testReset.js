import { Builder, By, until } from 'selenium-webdriver';

const testReset = async () => {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Reset']")), 15000); // Adjust selector based on your DOM
        const updatePackageLink = await driver.findElement(By.xpath("//h3[text()='Reset']"));

        await updatePackageLink.click();

        // Wait for the reset button to appear
        const resetButton = await driver.wait(
            until.elementLocated(By.xpath("//button[text()='Reset Registry']")),
            10000
        );

        // Click the reset button
        await resetButton.click();

        // Verify that the button's text changes to "Resetting..."
        const resettingButton = await driver.wait(
            until.elementLocated(By.xpath("//button[text()='Resetting...']")),
            5000
        );
        await driver.wait(until.elementIsVisible(resettingButton), 5000);

        console.log('Reset button state successfully changed to "Resetting...".');

        // Wait for the button to return to "Reset Registry" state
        await driver.wait(
            until.elementLocated(By.xpath("//button[text()='Reset Registry']")),
            10000
        );
        console.log('Reset completed, button reverted to "Reset Registry".');

        // Verify no error message is displayed
        const errorElements = await driver.findElements(By.xpath("//div[contains(@style,'color: red')]"));
        if (errorElements.length === 0) {
            console.log('No error messages displayed. Test passed.');
        } else {
            const errorMessage = await errorElements[0].getText();
            console.error('Error displayed:', errorMessage);
        }

    } catch (error) {
        console.error('Reset test failed:', error.message);
    } finally {
        await driver.quit();
    }
};

// Run the test
testReset();
