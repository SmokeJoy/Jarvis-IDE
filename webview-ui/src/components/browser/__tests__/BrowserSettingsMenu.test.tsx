import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserSettingsMenu } from '../BrowserSettingsMenu';
import { useExtensionState } from '../../../context/ExtensionStateContext';
import { useExtensionMessage } from '../../../hooks/useExtensionMessage';
import { BROWSER_VIEWPORT_PRESETS } from '../../../../../src/shared/BrowserSettings';

// Mock degli hook
jest.mock('../../../context/ExtensionStateContext');
jest.mock('../../../hooks/useExtensionMessage');

describe('BrowserSettingsMenu', () => {
  // Default mocks setup
  const mockPostMessage = jest.fn();
  const mockBrowserSettings = {
    headless: true,
    viewport: { width: 1280, height: 800 },
    timeout: 30000,
    debugMode: false,
    width: 1280,
    height: 800,
    trackNetworkActivity: true,
    screenshotSettings: {
      format: 'png',
      quality: 80,
      fullPage: false,
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useExtensionState as jest.Mock).mockReturnValue({
      browserSettings: mockBrowserSettings
    });
    (useExtensionMessage as jest.Mock).mockReturnValue({
      postMessage: mockPostMessage
    });
  });

  it('renders the settings button correctly', () => {
    render(<BrowserSettingsMenu />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should open menu when clicking the button', async () => {
    render(<BrowserSettingsMenu />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Run in headless mode')).toBeInTheDocument();
      expect(screen.getByText('Viewport Size')).toBeInTheDocument();
    });
  });

  it('should toggle headless mode when checkbox is clicked', async () => {
    render(<BrowserSettingsMenu />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const checkbox = await screen.findByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'browserSettings',
      browserSettings: {
        ...mockBrowserSettings,
        headless: false // Toggle from true to false
      }
    });
  });

  it('should update viewport when dropdown selection changes', async () => {
    render(<BrowserSettingsMenu />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Find dropdown and change value
    const dropdown = await screen.findByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'Mobile (360x640)' } });
    
    const mobilePreset = BROWSER_VIEWPORT_PRESETS['Mobile (360x640)'];
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'browserSettings',
      browserSettings: {
        ...mockBrowserSettings,
        viewport: mobilePreset
      }
    });
  });

  it('should close menu when clicking outside', async () => {
    render(<BrowserSettingsMenu />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Check menu is open
    expect(screen.getByText('Run in headless mode')).toBeInTheDocument();
    
    // Click outside (simulate click away)
    fireEvent.mouseDown(document.body);
    
    // Menu should close
    await waitFor(() => {
      expect(screen.queryByText('Run in headless mode')).not.toBeInTheDocument();
    });
  });

  it('should handle mouse enter and leave correctly', async () => {
    render(<BrowserSettingsMenu />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Find menu element
    const menuElement = screen.getByText('Run in headless mode').closest('div');
    expect(menuElement).toBeInTheDocument();
    
    // Trigger mouse enter
    if (menuElement) {
      fireEvent.mouseEnter(menuElement);
      
      // Trigger mouse leave - menu should stay open due to mouse tracking
      fireEvent.mouseLeave(menuElement);
      
      // Menu should still be open
      expect(screen.getByText('Run in headless mode')).toBeInTheDocument();
    }
  });

  it('should handle container mouse leave correctly', async () => {
    const { container } = render(<BrowserSettingsMenu />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Find the container div
    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toBeInTheDocument();
    
    // Trigger mouse leave on container
    fireEvent.mouseLeave(containerDiv, {
      clientX: 500, // Far outside the menu
      clientY: 500
    });
    
    // Menu should close
    await waitFor(() => {
      expect(screen.queryByText('Run in headless mode')).not.toBeInTheDocument();
    });
  });
  
  it('should handle disabled state correctly', () => {
    render(<BrowserSettingsMenu disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should handle maxWidth prop correctly', async () => {
    render(<BrowserSettingsMenu maxWidth={500} />);
    
    // Open menu
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Find menu element
    const menuElement = screen.getByText('Run in headless mode').closest('div');
    expect(menuElement).toBeInTheDocument();
    
    // This is difficult to test exactly, but we can check the style attribute exists
    if (menuElement) {
      expect(menuElement).toHaveStyle('max-width: 477px'); // maxWidth - 23
    }
  });
}); 