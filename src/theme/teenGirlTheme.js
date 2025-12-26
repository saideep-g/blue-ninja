export const TeenGirlTheme = {
    colors: {
        // Primary - Vibrant purple (modern, fun, but not too girly)
        primary: '#A855F7',        // Vivid Purple
        primaryLight: '#E9D5FF',   // Light Purple
        primaryDark: '#7E22CE',    // Deep Purple

        // Accent - Coral/Pink (energetic, warm)
        accent: '#F43F5E',         // Coral Pink
        accentLight: '#FFE4E6',    // Light Coral
        accentDark: '#BE123C',     // Dark Coral

        // Secondary - Teal (cool, calming)
        secondary: '#06B6D4',      // Teal
        secondaryLight: '#CFFAFE', // Light Teal
        secondaryDark: '#0891B2',  // Dark Teal

        // Success - Bright green
        success: '#10B981',        // Emerald Green
        successLight: '#D1FAE5',   // Light Green

        // Warning - Amber
        warning: '#F59E0B',        // Amber
        warningLight: '#FEF3C7',   // Light Amber

        // Error - Rose
        error: '#EF4444',          // Rose Red
        errorLight: '#FEE2E2',     // Light Rose

        // Background
        bgPrimary: '#FAFAFA',      // Off-white
        bgSecondary: '#F3F4F6',    // Light gray
        surface: '#FFFFFF',        // White

        // Text
        textPrimary: '#1F2937',    // Dark Gray
        textSecondary: '#6B7280',  // Medium Gray
        textLight: '#9CA3AF',      // Light Gray

        // Gradients
        gradientPrimary: 'linear-gradient(135deg, #A855F7 0%, #F43F5E 100%)',     // Purple to Coral
        gradientSuccess: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',     // Green to Teal
        gradientWarm: 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%)',       // Amber to Coral
    },

    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
    },

    borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
    },

    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        lg: '0 10px 25px 0 rgba(0, 0, 0, 0.15)',
        xl: '0 20px 40px 0 rgba(0, 0, 0, 0.2)',
    },

    typography: {
        fontFamily: {
            base: "'Inter', 'Segoe UI', sans-serif",
            display: "'Poppins', sans-serif", // Fun, rounded font for headers
        },
        fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            black: 900,
        },
    },
};

export const getCSSVariables = (theme) => {
    const vars = {};
    Object.entries(theme.colors).forEach(([key, value]) => {
        vars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
    });
    return vars;
};
