import { HomePage } from './Homepage.js';
import { LoginPage } from './LoginPage.js';

export class PageManager {
    constructor(page) {
        this.page = page;
        this.homePage = null;
        this.loginPage = null;
    }

    getHomePage() {
        if (!this.homePage) {
            this.homePage = new HomePage(this.page);
        }
        return this.homePage;
    }

    getLoginPage() {
        if (!this.loginPage) {
            this.loginPage = new LoginPage(this.page);
        }
        return this.loginPage;
    }
}
