// components/UI/FolderIcon.jsx

import * as React from 'react';
import Svg, { G, Rect, Path } from 'react-native-svg';

/**
 * A reusable, dynamic SVG component for the folder background.
 * The fill and stroke colors are passed as props for theme and state awareness.
 * @param {object} props - Component props including width, height, style, primaryColor, and secondaryColor.
 */
const FolderIcon = (props) => (
  // The viewBox is taken directly from your SVG analysis.
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 50 50"
    style={props.style}
    {...props}
  >
    <G
        id="g3073"
        transform="matrix(0.99721035,0,0,1.0123513,-48.818259,-111.27576)"
        // ==================== ROOT IMPLEMENTATION START ====================
        // The original hardcoded colors are replaced with dynamic props.
        fill={props.primaryColor}
        stroke={props.secondaryColor}
        // ===================== ROOT IMPLEMENTATION END =====================
        strokeWidth={0.99527}
        strokeDasharray="none"
        strokeOpacity={1}
      >
        <G
          id="g1868"
          // These inline styles are inherited, so we don't need to repeat the colors.
        >
          <G
            id="g1115-9-8-0"
            strokeWidth={0.795685}
            transform="matrix(1.3340941,0,0,1.1727709,15.393487,-27.645264)"
          >
            {/* The rect styles are also inherited. */}
            <Rect
              id="rect556-0-6-3"
              width={8.4866266}
              height={3.4582331}
              x={32.997311}
              y={126.70853}
              ry={1.4563972}
              rx={0.86035544}
            />
            <Rect
              id="rect554-5-5-9"
              width={25.072187}
              height={21.181688}
              x={31.412287}
              y={128.8192}
              ry={2.6700618}
              rx={2.3828268}
            />
          </G>
          <Path
            strokeWidth={0.99527}
            d="m 57.837951,143.13604 32.385199,0.0782"
            id="path1927"
          />
        </G>
      </G>
  </Svg>
);

export default FolderIcon;