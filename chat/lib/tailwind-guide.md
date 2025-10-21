# Tailwind CSS Classes Guide

## Common Issues and Solutions

### ❌ Non-existent Classes
These classes don't exist in standard Tailwind CSS:
- `ml-6`, `ml-8` → Use `ml-6` (exists) or inline styles
- `mr-6`, `mr-8` → Use `mr-6` (exists) or inline styles  
- `space-x-6` → Use `space-x-4` (max) or inline styles
- `space-y-6` → Use `space-y-4` (max) or inline styles

### ✅ Standard Tailwind Classes
These classes exist and work:
- `ml-1`, `ml-2`, `ml-3`, `ml-4`, `ml-5`, `ml-6` (margin-left)
- `mr-1`, `mr-2`, `mr-3`, `mr-4`, `mr-5`, `mr-6` (margin-right)
- `space-x-1`, `space-x-2`, `space-x-3`, `space-x-4` (horizontal spacing)
- `space-y-1`, `space-y-2`, `space-y-3`, `space-y-4` (vertical spacing)

### 🔧 Alternative Solutions

#### For Larger Margins:
```jsx
// Instead of ml-8 (doesn't exist)
<div style={{ marginLeft: '2rem' }}>Content</div>

// Or use existing classes
<div className="ml-6">Content</div> // 1.5rem
```

#### For Custom Spacing:
```jsx
// Instead of space-x-6 (doesn't exist)
<div className="flex" style={{ gap: '1.5rem' }}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Or use existing classes
<div className="flex space-x-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

#### For List Styling:
```jsx
// Correct list styling
<ul className="list-disc list-outside ml-6 mb-2 space-y-1">
  <li className="mb-1">Item 1</li>
  <li className="mb-1">Item 2</li>
</ul>
```

## Recommended Approach

1. **Use Standard Tailwind Classes**: Stick to documented classes
2. **Inline Styles for Custom Values**: Use `style={{}}` for specific measurements
3. **CSS Custom Properties**: Define custom spacing in your CSS
4. **Extend Tailwind Config**: Add custom spacing values to `tailwind.config.js`

## Tailwind Config Extension Example

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      }
    }
  }
}
```

This would allow you to use `ml-18`, `ml-22`, etc.
