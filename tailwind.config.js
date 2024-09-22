/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.tsx"],
    theme: {
        extend: {
            colors: {
                text: "#353740",
                subtext: "#6E6E81",
                background: "#FFFFFF",
                "subtle-background": "#FAFAFB",
                "button-background": "#ECECF1",
                "active-button-background": "#E3E3EB",
                border: "#D9D9E3",
                "light-border": "#ECECF1",
            },
            fontWeight: {
                "normal+": 425,
                "medium+": 525,
            },
            letterSpacing: {
                default: "-0.015em",
            },
            opacity: {
                hover: 0.85,
                disabled: 0.5,
            },
            screens: {
                mobile: { max: "1024px" },
            },
        },
    },
    plugins: [],
}
