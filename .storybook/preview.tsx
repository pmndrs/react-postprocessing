import React from 'react'
import type { Preview } from '@storybook/react'

import './index.css'

const preview: Preview = {
  parameters: {
    // actions: { argTypesRegex: '^on[A-Z].*' },
    // controls: {
    //   matchers: {
    //     color: /(background|color)$/i,
    //     date: /Date$/,
    //   },
    // },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <React.Suspense fallback={null}>
        <Story />
      </React.Suspense>
    ),
  ],
}

export default preview
