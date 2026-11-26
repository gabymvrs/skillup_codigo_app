import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledWrapper aria-hidden="true">
      <svg className="gegga">
        <defs>
          <filter id="gegga">
            <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"
              result="inreGegga"
            />
            <feComposite in="SourceGraphic" in2="inreGegga" operator="atop" />
          </filter>
        </defs>
      </svg>
      <svg className="snurra" width={240} height={240} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="linjarGradient">
            <stop className="stopp1" offset={0} />
            <stop className="stopp2" offset={1} />
          </linearGradient>
          <linearGradient
            y2={160}
            x2={160}
            y1={40}
            x1={40}
            gradientUnits="userSpaceOnUse"
            id="loaderGradient"
            xlinkHref="#linjarGradient"
          />
        </defs>
        <path
          className="halvan"
          d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64"
        />
        <circle className="strecken" cx={100} cy={100} r={64} />
      </svg>
      <svg className="skugga" width={240} height={240} viewBox="0 0 200 200">
        <path
          className="halvan"
          d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64"
        />
        <circle className="strecken" cx={100} cy={100} r={64} />
      </svg>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: relative;
  width: 240px;
  height: 240px;

  svg {
    display: block;
  }

  .gegga {
    position: absolute;
    width: 0;
    height: 0;
  }

  .snurra {
    position: relative;
    z-index: 1;
    filter: url(#gegga);
  }

  .stopp1 {
    stop-color: #00dcff;
  }

  .stopp2 {
    stop-color: #3474f4;
  }

  .halvan {
    animation: snurra1 10s infinite linear;
    stroke-dasharray: 180 800;
    fill: none;
    stroke: url(#loaderGradient);
    stroke-width: 23;
    stroke-linecap: round;
  }

  .strecken {
    animation: snurra1 3s infinite linear;
    stroke-dasharray: 26 54;
    fill: none;
    stroke: url(#loaderGradient);
    stroke-width: 23;
    stroke-linecap: round;
  }

  .skugga {
    position: absolute;
    inset: 0;
    filter: blur(5px);
    opacity: 0.3;
    transform: translate(3px, 3px);
  }

  @keyframes snurra1 {
    to {
      stroke-dashoffset: -403px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .halvan,
    .strecken {
      animation: none;
    }
  }
`;

export default Loader;
