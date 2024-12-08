import { Builder, By, until } from 'selenium-webdriver';

const testReset = async () => {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');  // Replace with your app URL

        await driver.wait(until.elementLocated(By.xpath("//h3[text()='Reset']")), 15000); // Adjust selector based on your DOM
        const updatePackageLink = await driver.findElement(By.xpath("//h3[text()='Reset']"));

        await updatePackageLink.click();

        // Wait for the reset button to appear
        await driver.wait(
            until.elementLocated(By.xpath("//button[text()='Reset Registry']")),
            10000
        );

        // complete
        console.log('Reset test passed!');

    } catch (error) {
        console.error('Reset test failed:', error.message);
    } finally {
        await driver.quit();
    }
};

// Run the test
testReset();
