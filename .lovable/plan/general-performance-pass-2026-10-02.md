# General performance pass

## Changes
- Reduce the amount and resolution of animated rain and dust while preserving their density and look.
- Pause canvas effects when the tab is hidden and avoid unnecessary work between frames.
- Replace mouse-move React rerenders on the welcome screen with direct, frame-limited visual movement.
- Stop preloading every large image at highest priority; prioritize the opening image and load later artwork progressively.
- Remove the most expensive continuously animated blur and shadow effects while keeping the same visual hierarchy.
- Verify the manor journey, room transition, welcome screen, archive, chart dragging, and mobile layout.

## Technical details
- Cap canvas pixel density and particle counts according to viewport/device capability.
- Reuse cached canvas gradients and pane geometry where possible.
- Keep animations compositor-friendly with transform and opacity.
- Preserve reduced-motion behavior and all existing content, sounds, imagery, and interactions.
