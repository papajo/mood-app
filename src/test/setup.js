import React from 'react';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const stripMotionProps = (props = {}) => {
  const {
    whileHover,
    whileTap,
    whileFocus,
    whileInView,
    initial,
    animate,
    exit,
    transition,
    variants,
    ...rest
  } = props;
  return rest;
};

// Simplify framer-motion to avoid async act warnings in tests
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, key) => {
      const tag = typeof key === 'string' ? key : 'div';
      return (props) => React.createElement(tag, stripMotionProps(props));
    }
  }),
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children)
}));
