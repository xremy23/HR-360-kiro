import '@testing-library/jest-dom'
import '@testing-library/jest-dom';

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = function() {};
