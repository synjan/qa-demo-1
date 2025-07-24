# Theme System Documentation

This application uses a comprehensive theme system built on Tailwind CSS v4 with CSS variables for easy customization.

## How It Works

The theme system uses CSS custom properties (variables) that automatically switch between light and dark modes. All colors are defined in `src/app/globals.css` and can be easily adjusted.

## Color Variables

### Core Colors
- `background` - Main page background
- `foreground` - Main text color
- `card` - Card background color
- `card-foreground` - Text color on cards
- `border` - Default border color
- `input` - Input field background
- `ring` - Focus ring color

### Semantic Colors
- `primary` - Primary brand color (buttons, links)
- `secondary` - Secondary elements
- `muted` - Muted backgrounds and text
- `accent` - Accent/hover states
- `destructive` - Error states and destructive actions

### QA-Specific Colors
- `test-pass` - Passed test color
- `test-fail` - Failed test color
- `test-blocked` - Blocked test color
- `test-skip` - Skipped test color
- `priority-critical` - Critical priority
- `priority-high` - High priority
- `priority-medium` - Medium priority
- `priority-low` - Low priority

## Customizing Colors

To customize the theme colors:

1. Open `src/app/globals.css`
2. Find the `:root` section for light theme
3. Find the `.dark` section for dark theme
4. Adjust the HSL values for any color variable

Example:
```css
:root {
  --background: 0 0% 100%; /* White */
  --foreground: 0 0% 3.9%; /* Nearly black */
}

.dark {
  --background: 0 0% 0%; /* Pure black */
  --foreground: 0 0% 100%; /* Pure white */
}
```

## Using Theme Colors

In your components, use the semantic color classes:

```jsx
// Background colors
<div className="bg-background">      // Main background
<div className="bg-card">           // Card background
<div className="bg-primary">        // Primary color background

// Text colors
<p className="text-foreground">     // Main text
<p className="text-muted-foreground"> // Muted text
<p className="text-primary">        // Primary color text

// Borders
<div className="border-border">     // Default border
<div className="border-primary">    // Primary color border
```

## Dark Mode

Dark mode is handled automatically by the `ThemeProvider` component. Users can toggle between:
- Light mode
- Dark mode
- System preference

The theme toggle is available in the navigation bar.

## Benefits

1. **Consistency** - All components use the same color system
2. **Easy Customization** - Change colors in one place
3. **Accessibility** - High contrast modes are easy to implement
4. **Performance** - CSS variables are highly performant
5. **Maintainability** - Semantic color names make code self-documenting