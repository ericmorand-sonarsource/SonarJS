import { runTest } from '../../test';

const code = `const window = {
    watchMedia: () => {
        return "(min-device-width: 992px)";
    }
}

const frappe = {
    ui: {},
    boot: {
        user: {},
    },
    router: {
        current_route: null,
    },
}

frappe.ui.init_onboarding_tour = () => {
	let route = frappe.router.current_route.bar;
}

frappe.ui.init_onboarding_tour();`;

runTest('t01-01', code);
