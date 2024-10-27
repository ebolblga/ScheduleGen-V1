/** @type {import('tailwindcss').Config} */

import { colors } from './types/tailwindcss'

export default {
    content: [],
    theme: {
        extend: {},
        colors: {
            // Не забудь также добавить в types/tailwindcss.d.ts
            // text: "#f8f1e2",
            // background: "#282828",
            // background2: "#1D2021",
            // primary: "#e6cf90",
            // secondary: "#836117",
            // accent: "#FABD2F",
            ...colors,
        },
    },
    plugins: [],
}
