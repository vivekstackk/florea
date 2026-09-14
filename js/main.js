/* ================================================================
   FLORÉA — SPATIAL BOTANICAL ARCHIVE
   FULL MAIN.JS REPLACEMENT

   INTRO:
   BLOOM
      ↓
   SMALL SQUARE CARDS
      ↓
   PROPER WIDE 3D ORBIT
      ↓
   SMOOTH ROTATION
      ↓
   COLLAPSE TO ONE CARD
      ↓
   CLEAN OUTWARD SPREAD
      ↓
   NORMAL GALLERY

   Existing:
   - 3D gallery rotation
   - Drag / inertia
   - Mouse parallax
   - Wheel rotation
   - Click to focus
   - Detail panel
   - Navigation
   - Cursor
   - Ambient particles
   ================================================================ */

(() => {
  "use strict";

  /* ================================================================
     DEVICE
     ================================================================ */

  const IS_TOUCH =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  /* ================================================================
     DOM
     ================================================================ */

  const viewport =
    document.getElementById("canvas-viewport");

  const galleryScene =
    document.getElementById("gallery-scene");

  const cards =
    Array.from(document.querySelectorAll(".card"));

  const cursor =
    document.getElementById("cursor");

  const ambientCanvas =
    document.getElementById("ambient-canvas");

  const detailOverlay =
    document.getElementById("detail-overlay");

  const detailCloseBtn =
    document.getElementById("detail-close-btn");

  const detailRef =
    document.getElementById("detail-ref");

  const detailOrigin =
    document.getElementById("detail-origin");

  const detailName =
    document.getElementById("detail-name");

  const detailLatin =
    document.getElementById("detail-latin");

  const detailEmotion =
    document.getElementById("detail-emotion");

  const detailSecondary =
    document.getElementById("detail-secondary");

  const detailMeaning =
    document.getElementById("detail-meaning");

  const detailDesc =
    document.getElementById("detail-desc");

  const detailSymbolism =
    document.getElementById("detail-symbolism");

  const navLinks =
    Array.from(
      document.querySelectorAll(".header__nav a")
    );

  const navHome =
    document.getElementById("nav-home");

  const footerTag =
    document.querySelector(".archive-footer__tag");


  /* ================================================================
     DIMENSIONS
     ================================================================ */

  let vw = window.innerWidth;
  let vh = window.innerHeight;

  function updateDimensions() {
    vw = window.innerWidth;
    vh = window.innerHeight;
  }

  window.addEventListener(
    "resize",
    updateDimensions,
    { passive: true }
  );


  /* ================================================================
     CARD DATA
     ================================================================ */

  const cardData = cards.map((card, i) => {

    const x =
      parseFloat(card.dataset.x) || 0;

    const y =
      parseFloat(card.dataset.y) || 0;

    const z =
      parseFloat(card.dataset.z) || 0;

    const scale =
      parseFloat(card.dataset.scale) || 1;

    const rx =
      parseFloat(card.dataset.rx) || 0;

    const ry =
      parseFloat(card.dataset.ry) || 0;

    const rz =
      parseFloat(card.dataset.rz) || 0;

    const w =
      parseFloat(card.style.width) || 80;

    const h =
      parseFloat(card.style.height) || 100;

    card.style.position = "absolute";
    card.style.left = "0";
    card.style.top = "0";

    card.style.transformOrigin =
      "50% 50%";

    card.style.transformStyle =
      "preserve-3d";

    card.style.backfaceVisibility =
      "hidden";

    card.style.willChange =
      "transform, opacity";

    return {
      el: card,

      baseX: x,
      baseY: y,
      baseZ: z,

      baseScale: scale,

      baseRx: rx,
      baseRy: ry,
      baseRz: rz,

      w,
      h,

      floatSpeed:
        0.55 + (i % 5) * 0.08,

      floatPhase:
        i * 0.92,

      floatAmp:
        2.5 + (i % 4) * 0.6,

      name:
        card.dataset.name || "",

      emotion:
        card.dataset.emotion || ""
    };
  });


  /* ================================================================
     STATE
     ================================================================ */

  const state = {

    /* normal gallery */

    rotY: 0,
    targetRotY: 0,
    velRotY: 0,

    parallaxRotY: 0,
    curParallaxY: 0,

    isDragging: false,
    hasDragged: false,

    startPx: 0,
    startPy: 0,

    lastPx: 0,
    lastPy: 0,

    /* focus */

    isFocused: false,
    focusedCard: null,
    focusedIndex: -1,
    focusProgress: 0,

    /* intro */

    intro: true,
    introStart: performance.now(),

    introProgress: 0
  };


  /* ================================================================
     INTRO CONFIG
     ================================================================ */

  const INTRO = {

    /*
      BLOOM title
    */

    bloomIn: 0.75,
    bloomHold: 0.55,
    bloomOut: 0.45,

    /*
      Cards appear
    */

    cardAppear: 0.55,

    /*
      Proper wide orbit
    */

    orbitDuration: 2.9,

    /*
      Number of complete rotations
    */

    orbitTurns: 1.25,

    /*
      Wide horizontal circle
    */

    radiusX: 390,
    radiusY: 245,

    /*
      Real 3D depth
    */

    radiusZ: 125,

    /*
      Intro cards are deliberately small
    */

    cardScale: 0.55,

    /*
      Collapse
    */

    collapseDuration: 0.85,

    /*
      Hold one card
    */

    singleHold: 0.35,

    /*
      Final spread
    */

    spreadDuration: 1.55
  };


  /* ================================================================
     EASING
     ================================================================ */

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 -
          Math.pow(-2 * t + 2, 3) / 2;
  }

  function clamp(v, min, max) {
    return Math.max(
      min,
      Math.min(max, v)
    );
  }


  /* ================================================================
     INTRO OVERLAY
     ================================================================ */

  const introOverlay =
    document.createElement("div");

  introOverlay.id =
    "florea-intro";

  introOverlay.innerHTML = `
    <div class="intro-left">
      FLORÉA
    </div>

    <div class="intro-center">
      BLOOM
    </div>

    <div class="intro-right">
      BOTANICAL ARCHIVE
    </div>
  `;

  document.body.appendChild(
    introOverlay
  );

  Object.assign(
    introOverlay.style,
    {
      position: "fixed",
      inset: "0",
      zIndex: "5000",
      pointerEvents: "none",
      opacity: "1",
      overflow: "hidden"
    }
  );

  const introLeft =
    introOverlay.querySelector(
      ".intro-left"
    );

  const introCenter =
    introOverlay.querySelector(
      ".intro-center"
    );

  const introRight =
    introOverlay.querySelector(
      ".intro-right"
    );


  /* ================================================================
     INTRO STYLES
     ================================================================ */

  const introStyle =
    document.createElement("style");

  introStyle.textContent = `

    html.florea-intro-active,
    html.florea-intro-active body {
      overflow: hidden !important;
    }

    #florea-intro {
      font-family:
        "Cormorant Garamond",
        Georgia,
        "Times New Roman",
        serif;
      color: #11110f;
    }

    #florea-intro .intro-left,
    #florea-intro .intro-right {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      letter-spacing: 0.05em;
      white-space: nowrap;
      opacity: 0;
    }

    #florea-intro .intro-left {
      left: 7%;
    }

    #florea-intro .intro-right {
      right: 7%;
    }

    #florea-intro .intro-center {
      position: absolute;
      left: 50%;
      top: 50%;
      transform:
        translate(-50%, -50%);
      font-size:
        clamp(58px, 7vw, 108px);
      font-weight: 300;
      letter-spacing: 0.30em;
      white-space: nowrap;
      opacity: 0;
      filter: blur(12px);
    }

    .florea-intro-card {
      pointer-events: none !important;
      transform-style: preserve-3d !important;
      backface-visibility: hidden !important;
      transition: none !important;
    }

  `;

  document.head.appendChild(
    introStyle
  );

  document.documentElement.classList.add(
    "florea-intro-active"
  );


  /* ================================================================
     INTRO CARD TRANSFORM
     ================================================================ */

  function introTransform(
    data,
    x,
    y,
    z,
    scale,
    rotationY = 0
  ) {

    data.el.style.transform =
      `
      translate3d(
        ${x - data.w / 2}px,
        ${y - data.h / 2}px,
        ${z}px
      )
      rotateY(${rotationY}deg)
      scale(${scale})
      `;

    data.el.style.opacity = "1";

    data.el.style.zIndex =
      String(
        Math.round(
          1000 + z
        )
      );
  }


  /* ================================================================
     FINAL POSITION
     ================================================================ */

  function finalPosition(
    data,
    index
  ) {

    const responsive =
      Math.min(
        vw / 1440,
        vh / 900,
        1
      );

    const scale =
      Math.max(
        0.72,
        responsive
      );

    const x =
      data.baseX * scale;

    const y =
      data.baseY * scale;

    const z =
      data.baseZ * scale;

    const floatY =
      Math.sin(
        performance.now() *
          0.00055 *
          data.floatSpeed +
          data.floatPhase
      ) *
      data.floatAmp;

    return {
      x,
      y: y + floatY,
      z,
      scale:
        data.baseScale *
        Math.max(
          0.85,
          responsive
        )
    };
  }


  /* ================================================================
     INTRO RENDER
     ================================================================ */

  function renderIntro(
    elapsed
  ) {

    const totalCards =
      cardData.length;

    /*
      TIMELINE
    */

    const bloomEnd =
      INTRO.bloomIn +
      INTRO.bloomHold +
      INTRO.bloomOut;

    const orbitStart =
      bloomEnd;

    const orbitEnd =
      orbitStart +
      INTRO.cardAppear +
      INTRO.orbitDuration;

    const collapseStart =
      orbitEnd;

    const collapseEnd =
      collapseStart +
      INTRO.collapseDuration;

    const singleEnd =
      collapseEnd +
      INTRO.singleHold;

    const spreadEnd =
      singleEnd +
      INTRO.spreadDuration;


    /* ============================================================
       PHASE 1 — BLOOM
       ============================================================ */

    if (elapsed < bloomEnd) {

      let centerOpacity = 0;
      let leftOpacity = 0;
      let rightOpacity = 0;

      /*
        BLOOM IN
      */

      if (
        elapsed <
        INTRO.bloomIn
      ) {

        const p =
          clamp(
            elapsed /
              INTRO.bloomIn,
            0,
            1
          );

        const e =
          easeOutQuart(p);

        centerOpacity = e;
        leftOpacity =
          clamp(
            p * 1.5,
            0,
            1
          );

        rightOpacity =
          clamp(
            p * 1.5,
            0,
            1
          );

        introCenter.style.transform =
          `
          translate(-50%, -50%)
          translateY(${(1 - e) * 20}px)
          scale(${0.96 + e * 0.04})
          `;

        introCenter.style.filter =
          `blur(${(1 - e) * 12}px)`;
      }

      /*
        HOLD
      */

      else if (
        elapsed <
        INTRO.bloomIn +
        INTRO.bloomHold
      ) {

        centerOpacity = 1;
        leftOpacity = 1;
        rightOpacity = 1;

        introCenter.style.transform =
          `
          translate(-50%, -50%)
          scale(1)
          `;

        introCenter.style.filter =
          "blur(0)";
      }

      /*
        OUT
      */

      else {

        const start =
          INTRO.bloomIn +
          INTRO.bloomHold;

        const p =
          clamp(
            (elapsed - start) /
              INTRO.bloomOut,
            0,
            1
          );

        const e =
          easeInOutCubic(p);

        centerOpacity =
          1 - e;

        leftOpacity =
          1 - e;

        rightOpacity =
          1 - e;

        introCenter.style.transform =
          `
          translate(-50%, -50%)
          translateY(${-e * 12}px)
          scale(${1 + e * 0.015})
          `;

        introCenter.style.filter =
          `blur(${e * 7}px)`;
      }

      introCenter.style.opacity =
        String(centerOpacity);

      introLeft.style.opacity =
        String(leftOpacity);

      introRight.style.opacity =
        String(rightOpacity);


      /*
        Keep every card completely hidden.
      */

      cardData.forEach(
        data => {
          data.el.classList.add(
            "florea-intro-card"
          );

          data.el.style.opacity = "0";

          introTransform(
            data,
            0,
            0,
            -100,
            INTRO.cardScale
          );

          data.el.style.opacity = "0";
        }
      );

      return false;
    }


    /* ============================================================
       PHASE 2 — CARDS ENTER + FORM PERFECT ORBIT
       ============================================================ */

    if (
      elapsed <
      orbitEnd
    ) {

      introCenter.style.opacity = "0";
      introLeft.style.opacity = "0";
      introRight.style.opacity = "0";

      const local =
        elapsed - orbitStart;

      const appearP =
        clamp(
          local /
            INTRO.cardAppear,
          0,
          1
        );

      const appearEase =
        easeOutQuart(
          appearP
        );

      const orbitLocal =
        Math.max(
          0,
          local -
            INTRO.cardAppear
        );

      const orbitP =
        clamp(
          orbitLocal /
            INTRO.orbitDuration,
          0,
          1
        );

      /*
        Smooth continuous orbital movement.
        No jumps between frames.
      */

      const rotation =
        easeInOutCubic(
          orbitP
        ) *
        Math.PI *
        2 *
        INTRO.orbitTurns;

      cardData.forEach(
        (data, i) => {

          /*
            Equal angular spacing.
            This is the important part:
            every card gets its own exact
            position around the circle.
          */

          const baseAngle =
            (i / totalCards) *
            Math.PI *
            2 -
            Math.PI / 2;

          const angle =
            baseAngle +
            rotation;

          /*
            Wide circular orbit.
          */

          const x =
            Math.cos(angle) *
            INTRO.radiusX *
            appearEase;

          const y =
            Math.sin(angle) *
            INTRO.radiusY *
            appearEase;

          /*
            Real Z depth.
          */

          const z =
            Math.sin(angle) *
            INTRO.radiusZ *
            appearEase;

          /*
            Cards remain visually front-facing.
            Only tiny Y-axis movement for depth.
          */

          const facing =
            Math.sin(angle) * 3;

          /*
            Small square cards.
          */

          const scale =
            INTRO.cardScale;

          introTransform(
            data,
            x,
            y,
            z,
            scale,
            facing
          );

          /*
            All cards are fully opaque.
            No ghosting.
          */

          data.el.style.opacity =
            "1";

          /*
            Depth ordering.
          */

          data.el.style.zIndex =
            String(
              Math.round(
                1500 + z
              )
            );
        }
      );

      return false;
    }


    /* ============================================================
       PHASE 3 — COLLAPSE TO ONE CARD
       ============================================================ */

    if (
      elapsed <
      collapseEnd
    ) {

      introCenter.style.opacity = "0";

      const p =
        clamp(
          (elapsed -
            collapseStart) /
            INTRO.collapseDuration,
          0,
          1
        );

      const e =
        easeInOutCubic(p);

      /*
        Keep the same circular starting
        positions so collapse feels connected.
      */

      const orbitProgress = 1;

      const rotation =
        Math.PI *
        2 *
        INTRO.orbitTurns;

      cardData.forEach(
        (data, i) => {

          const angle =
            (i / totalCards) *
              Math.PI *
              2 -
            Math.PI / 2 +
            rotation;

          const startX =
            Math.cos(angle) *
            INTRO.radiusX;

          const startY =
            Math.sin(angle) *
            INTRO.radiusY;

          const startZ =
            Math.sin(angle) *
            INTRO.radiusZ;

          const x =
            startX *
            (1 - e);

          const y =
            startY *
            (1 - e);

          const z =
            startZ *
            (1 - e);

          /*
            First card becomes the hero.
          */

          if (i === 0) {

            introTransform(
              data,
              x,
              y,
              80,
              INTRO.cardScale +
                e * 0.14,
              0
            );

            data.el.style.opacity =
              "1";

            data.el.style.zIndex =
              "3000";

          } else {

            /*
              Cards become hidden before
              physical overlap.

              This prevents the ugly
              transparent stacked-card effect.
            */

            const hideStart = 0.45;

            const visible =
              e < hideStart
                ? 1
                : 0;

            introTransform(
              data,
              x,
              y,
              z,
              INTRO.cardScale,
              0
            );

            data.el.style.opacity =
              String(visible);

            data.el.style.zIndex =
              String(
                1000 + i
              );
          }
        }
      );

      return false;
    }


    /* ============================================================
       PHASE 4 — ONE CENTER CARD
       ============================================================ */

    if (
      elapsed <
      singleEnd
    ) {

      introCenter.style.opacity = "0";

      cardData.forEach(
        (data, i) => {

          if (i === 0) {

            introTransform(
              data,
              0,
              0,
              80,
              INTRO.cardScale +
                0.14,
              0
            );

            data.el.style.opacity =
              "1";

            data.el.style.zIndex =
              "4000";

          } else {

            data.el.style.opacity =
              "0";
          }
        }
      );

      return false;
    }


    /* ============================================================
       PHASE 5 — CLEAN OUTWARD SPREAD
       ============================================================ */

    if (
      elapsed <
      spreadEnd
    ) {

      const p =
        clamp(
          (elapsed -
            singleEnd) /
            INTRO.spreadDuration,
          0,
          1
        );

      const e =
        easeOutQuart(p);

      cardData.forEach(
        (data, i) => {

          const final =
            finalPosition(
              data,
              i
            );

          /*
            Every card begins at exactly
            the center card position.

            Then travels directly outward.
          */

          const x =
            final.x * e;

          const y =
            final.y * e;

          const z =
            80 *
              (1 - e) +
            final.z * e;

          /*
            Keep all cards square,
            front-facing and opaque.
          */

          const scale =
            INTRO.cardScale +
            (final.scale -
              INTRO.cardScale) *
              e;

          introTransform(
            data,
            x,
            y,
            z,
            scale,
            0
          );

          /*
            No transparency overlay.
            Cards appear as solid objects.
          */

          data.el.style.opacity =
            "1";

          data.el.style.zIndex =
            String(
              2000 + i
            );
        }
      );

      return false;
    }


    /* ============================================================
       INTRO COMPLETE
       ============================================================ */

    finishIntro();

    return true;
  }


  /* ================================================================
     INTRO ANIMATION LOOP
     ================================================================ */

  function introTick() {

    if (!state.intro) {
      return;
    }

    const elapsed =
      (
        performance.now() -
        state.introStart
      ) / 1000;

    const finished =
      renderIntro(
        elapsed
      );

    if (!finished) {

      requestAnimationFrame(
        introTick
      );

    }
  }


  /* ================================================================
     FINISH INTRO
     ================================================================ */

  function finishIntro() {

    state.intro = false;

    document.documentElement.classList.remove(
      "florea-intro-active"
    );

    /*
      Remove intro overlay completely.
    */

    if (introOverlay) {
      introOverlay.remove();
    }

    /*
      Restore exact final positions.
    */

    cardData.forEach(
      (data, i) => {

        const final =
          finalPosition(
            data,
            i
          );

        data.el.classList.remove(
          "florea-intro-card"
        );

        data.el.style.opacity =
          "1";

        data.el.style.transform =
          `
          translate3d(
            ${final.x - data.w / 2}px,
            ${final.y - data.h / 2}px,
            ${final.z}px
          )
          scale(${final.scale})
          `;

        data.el.style.zIndex =
          String(
            Math.round(
              final.z + 600
            )
          );
      }
    );

    /*
      Tell other website systems
      that intro is finished.
    */

    document.dispatchEvent(
      new CustomEvent(
        "floreaIntroComplete"
      )
    );
  }


  requestAnimationFrame(
    introTick
  );


  /* ================================================================
     NORMAL 3D GALLERY ENGINE
     ================================================================ */

  function tick() {

    const now =
      performance.now() *
      0.001;

    /*
      During intro the intro renderer
      owns the cards.
    */

    if (state.intro) {

      requestAnimationFrame(
        tick
      );

      return;
    }


    /* ============================================================
       INERTIA
       ============================================================ */

    if (
      !state.isDragging &&
      !state.isFocused
    ) {

      if (
        Math.abs(
          state.velRotY
        ) > 0.0001
      ) {

        state.targetRotY +=
          state.velRotY;

        state.velRotY *=
          0.94;

      } else {

        state.velRotY = 0;
      }
    }


    /* ============================================================
       ROTATION LERP
       ============================================================ */

    state.rotY +=
      (
        state.targetRotY -
        state.rotY
      ) * 0.09;


    /* ============================================================
       PARALLAX
       ============================================================ */

    state.curParallaxY +=
      (
        state.parallaxRotY -
        state.curParallaxY
      ) * 0.06;


    /* ============================================================
       RESPONSIVE SCALE
       ============================================================ */

    const responsive =
      Math.min(
        vw / 1440,
        vh / 900,
        1
      );

    const globalScale =
      Math.max(
        0.72,
        responsive
      );


    /* ============================================================
       GLOBAL 3D ANGLE
       ============================================================ */

    const angle =
      state.rotY +
      state.curParallaxY;

    const cosA =
      Math.cos(angle);

    const sinA =
      Math.sin(angle);


    /* ============================================================
       RENDER CARDS
       ============================================================ */

    for (
      let i = 0;
      i < cardData.length;
      i++
    ) {

      const d =
        cardData[i];


      /*
        Rotate point cloud around
        vertical Y axis.
      */

      const rotatedX =
        d.baseX * cosA -
        d.baseZ * sinA;

      const rotatedZ =
        d.baseX * sinA +
        d.baseZ * cosA;


      const posX =
        rotatedX *
        globalScale;

      const posZ =
        rotatedZ *
        globalScale;

      const posY =
        d.baseY *
        globalScale;


      /*
        Very subtle organic floating.
      */

      const floatY =
        Math.sin(
          now *
            d.floatSpeed +
            d.floatPhase
        ) *
        d.floatAmp;


      /*
        Depth normalization.
      */

      const depthRadius =
        350;

      const depthNorm =
        Math.max(
          -1,
          Math.min(
            1,
            posZ /
              depthRadius
          )
        );


      /*
        Depth scale.
      */

      let currentScale =
        d.baseScale *
        (
          1 +
          depthNorm *
            0.22
        ) *
        Math.max(
          0.85,
          responsive
        );


      /*
        Z ordering.
      */

      let zIndex =
        Math.round(
          posZ + 600
        );


      /*
        Keep final cards crisp.
        Only extremely subtle depth
        treatment.
      */

      let opacity =
        1;

      let blurPx =
        0;


      /*
        Focus state.
      */

      if (
        state.isFocused &&
        state.focusedIndex === i
      ) {

        currentScale =
          d.baseScale *
          1.35;

        zIndex = 1000;

        opacity = 1;

        blurPx = 0;

      } else if (
        state.isFocused
      ) {

        opacity =
          Math.max(
            0.12,
            opacity *
              (
                1 -
                state.focusProgress *
                  0.84
              )
          );

        blurPx +=
          state.focusProgress *
          2.2;
      }


      /*
        Billboard positioning.

        Cards remain front-facing.
        No permanent card tilt.
      */

      const tx =
        posX -
        d.w / 2;

      const ty =
        posY +
        floatY -
        d.h / 2;

      const tz =
        posZ;


      d.el.style.transform =
        `
        translate3d(
          ${tx.toFixed(1)}px,
          ${ty.toFixed(1)}px,
          ${tz.toFixed(1)}px
        )
        scale(
          ${currentScale.toFixed(4)}
        )
        `;


      d.el.style.zIndex =
        String(zIndex);

      d.el.style.opacity =
        opacity.toFixed(3);

      d.el.style.filter =
        blurPx > 0.2
          ? `blur(${blurPx.toFixed(1)}px)`
          : "none";
    }


    requestAnimationFrame(
      tick
    );
  }

  requestAnimationFrame(
    tick
  );


  /* ================================================================
     MOUSE PARALLAX
     ================================================================ */

  window.addEventListener(
    "mousemove",
    e => {

      if (
        state.intro ||
        state.isDragging ||
        state.isFocused
      ) {
        return;
      }

      const normX =
        (
          e.clientX /
          vw
        ) * 2 - 1;

      state.parallaxRotY =
        normX * 0.05;
    },
    { passive: true }
  );


  /* ================================================================
     POINTER DOWN
     ================================================================ */

  if (viewport) {

    viewport.addEventListener(
      "pointerdown",
      e => {

        if (state.intro) {
          return;
        }

        if (
          e.target.closest(
            ".detail-panel"
          )
        ) {
          return;
        }

        if (
          e.target.closest(
            ".detail-overlay.is-active"
          )
        ) {
          return;
        }

        if (
          state.isFocused
        ) {
          return;
        }

        state.isDragging =
          true;

        state.hasDragged =
          false;

        state.startPx =
          e.clientX;

        state.startPy =
          e.clientY;

        state.lastPx =
          e.clientX;

        state.lastPy =
          e.clientY;

        state.velRotY =
          0;

        viewport.classList.add(
          "is-dragging"
        );
      }
    );

  }


  /* ================================================================
     POINTER MOVE
     ================================================================ */

  window.addEventListener(
    "pointermove",
    e => {

      if (
        !state.isDragging
      ) {
        return;
      }

      const dx =
        e.clientX -
        state.lastPx;

      const dy =
        e.clientY -
        state.lastPy;

      const totalDist =
        Math.hypot(
          e.clientX -
            state.startPx,
          e.clientY -
            state.startPy
        );

      if (
        totalDist > 5
      ) {
        state.hasDragged =
          true;
      }


      /*
        Horizontal drag controls
        the complete 360° space.
      */

      state.targetRotY +=
        dx * 0.005;


      /*
        Momentum.
      */

      state.velRotY =
        dx * 0.004;


      state.lastPx =
        e.clientX;

      state.lastPy =
        e.clientY;
    },
    { passive: true }
  );


  /* ================================================================
     POINTER UP
     ================================================================ */

  window.addEventListener(
    "pointerup",
    () => {

      if (
        !state.isDragging
      ) {
        return;
      }

      state.isDragging =
        false;

      if (viewport) {
        viewport.classList.remove(
          "is-dragging"
        );
      }

      setTimeout(
        () => {
          state.hasDragged =
            false;
        },
        90
      );
    }
  );


  window.addEventListener(
    "pointercancel",
    () => {

      state.isDragging =
        false;

      if (viewport) {
        viewport.classList.remove(
          "is-dragging"
        );
      }

      setTimeout(
        () => {
          state.hasDragged =
            false;
        },
        90
      );
    }
  );


  /* ================================================================
     WHEEL ROTATION
     ================================================================ */

  if (viewport) {

    viewport.addEventListener(
      "wheel",
      e => {

        if (
          state.intro ||
          state.isFocused
        ) {
          return;
        }

        e.preventDefault();

        const delta =
          Math.abs(e.deltaX) >
          Math.abs(e.deltaY)
            ? e.deltaX
            : e.deltaY;

        state.targetRotY +=
          delta * 0.0018;

        state.velRotY +=
          delta * 0.0008;
      },
      { passive: false }
    );

  }


  /* ================================================================
     CLICK TO FOCUS
     ================================================================ */

  function focusCard(
    card,
    index
  ) {

    if (
      state.focusedCard === card &&
      state.isFocused
    ) {
      return;
    }


    state.isFocused =
      true;

    state.focusedCard =
      card;

    state.focusedIndex =
      index;


    const d =
      cardData[index];

    const TWO_PI =
      Math.PI * 2;


    /*
      Bring clicked card to
      front-center.
    */

    const requiredAngle =
      Math.atan2(
        d.baseX,
        d.baseZ
      );


    const currentRot =
      state.targetRotY;

    let alignedTargetY =
      requiredAngle;


    while (
      alignedTargetY -
        currentRot >
      Math.PI
    ) {

      alignedTargetY -=
        TWO_PI;
    }


    while (
      alignedTargetY -
        currentRot <
      -Math.PI
    ) {

      alignedTargetY +=
        TWO_PI;
    }


    if (
      typeof gsap !== "undefined"
    ) {

      gsap.to(
        state,
        {
          targetRotY:
            alignedTargetY,

          focusProgress:
            1,

          duration:
            1.1,

          ease:
            "power3.out"
        }
      );

    } else {

      state.targetRotY =
        alignedTargetY;

      state.focusProgress =
        1;
    }


    /* ============================================================
       DETAIL CONTENT
       ============================================================ */

    if (detailRef) {
      detailRef.textContent =
        card.dataset.specimen ||
        "SPECIMEN";
    }

    if (detailOrigin) {
      detailOrigin.textContent =
        (
          card.dataset.origin ||
          "FLORÉA"
        ).toUpperCase();
    }

    if (detailName) {
      detailName.textContent =
        card.dataset.name ||
        "Specimen";
    }

    if (detailLatin) {
      detailLatin.textContent =
        card.dataset.latin ||
        "";
    }

    if (detailEmotion) {
      detailEmotion.textContent =
        card.dataset.emotion ||
        "";
    }

    if (detailSecondary) {
      detailSecondary.textContent =
        card.dataset.secondary ||
        "";
    }

    if (detailMeaning) {
      detailMeaning.textContent =
        `"${card.dataset.meaning || ""}"`;
    }

    if (detailDesc) {
      detailDesc.textContent =
        card.dataset.description ||
        "";
    }

    if (detailSymbolism) {
      detailSymbolism.textContent =
        card.dataset.symbolism ||
        "";
    }

    if (footerTag) {
      footerTag.textContent =
        `${
          card.dataset.name || ""
        } · ${
          card.dataset.emotion || ""
        }`;
    }


    /* ============================================================
       DETAIL OVERLAY
       ============================================================ */

    if (detailOverlay) {

      detailOverlay.classList.add(
        "is-active"
      );

      detailOverlay.setAttribute(
        "aria-hidden",
        "false"
      );

      if (
        typeof gsap !== "undefined"
      ) {

        gsap.killTweensOf(
          detailOverlay
        );

        gsap.fromTo(
          detailOverlay,

          {
            opacity: 0,
            x: 45
          },

          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            delay: 0.25,
            ease: "power3.out"
          }
        );
      }
    }
  }


  /* ================================================================
     CLOSE FOCUS
     ================================================================ */

  function closeFocus() {

    if (
      !state.isFocused
    ) {
      return;
    }

    state.isFocused =
      false;


    if (
      typeof gsap !== "undefined"
    ) {

      gsap.to(
        state,
        {
          focusProgress: 0,
          duration: 0.8,
          ease: "power2.out"
        }
      );

    } else {

      state.focusProgress =
        0;
    }


    if (
      detailOverlay &&
      typeof gsap !== "undefined"
    ) {

      gsap.to(
        detailOverlay,
        {
          opacity: 0,
          x: 25,
          duration: 0.35,
          ease: "power2.in",

          onComplete: () => {

            detailOverlay.classList.remove(
              "is-active"
            );

            detailOverlay.setAttribute(
              "aria-hidden",
              "true"
            );
          }
        }
      );

    } else if (
      detailOverlay
    ) {

      detailOverlay.classList.remove(
        "is-active"
      );

      detailOverlay.setAttribute(
        "aria-hidden",
        "true"
      );
    }


    state.focusedCard =
      null;

    state.focusedIndex =
      -1;


    if (footerTag) {

      footerTag.textContent =
        "Botanical Archive";
    }
  }


  /* ================================================================
     CARD EVENTS
     ================================================================ */

  cards.forEach(
    (card, i) => {

      card.addEventListener(
        "click",
        e => {

          if (
            state.intro ||
            state.hasDragged
          ) {
            return;
          }

          e.stopPropagation();

          focusCard(
            card,
            i
          );
        }
      );


      card.addEventListener(
        "mouseenter",
        () => {

          if (
            !state.isFocused &&
            footerTag
          ) {

            footerTag.textContent =
              `${
                card.dataset.name || ""
              } — ${
                card.dataset.emotion || ""
              }`;
          }
        }
      );


      card.addEventListener(
        "mouseleave",
        () => {

          if (
            !state.isFocused &&
            footerTag
          ) {

            footerTag.textContent =
              "Botanical Archive";
          }
        }
      );
    }
  );


  /* ================================================================
     DETAIL CLOSE BUTTON
     ================================================================ */

  if (detailCloseBtn) {

    detailCloseBtn.addEventListener(
      "click",
      e => {

        e.stopPropagation();

        closeFocus();
      }
    );
  }


  /* ================================================================
     DETAIL OVERLAY CLICK
     ================================================================ */

  if (detailOverlay) {

    detailOverlay.addEventListener(
      "click",
      e => {

        if (
          !e.target.closest(
            ".detail-panel"
          )
        ) {

          closeFocus();
        }
      }
    );
  }


  /* ================================================================
     ESCAPE
     ================================================================ */

  window.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Escape" &&
        state.isFocused
      ) {

        closeFocus();
      }
    }
  );


  /* ================================================================
     OUTSIDE CLICK
     ================================================================ */

  if (viewport) {

    viewport.addEventListener(
      "click",
      e => {

        if (
          state.isFocused &&
          !e.target.closest(
            ".card"
          ) &&
          !e.target.closest(
            ".detail-panel"
          )
        ) {

          closeFocus();
        }
      }
    );
  }


  /* ================================================================
     NAVIGATION
     ================================================================ */

  function setActiveNav(
    link
  ) {

    navLinks.forEach(
      l =>
        l.classList.remove(
          "is-active"
        )
    );

    if (link) {

      link.classList.add(
        "is-active"
      );
    }
  }


  /* ================================================================
     HOME
     ================================================================ */

  if (navHome) {

    navHome.addEventListener(
      "click",
      e => {

        e.preventDefault();

        closeFocus();

        setActiveNav(
          navHome
        );


        const TWO_PI =
          Math.PI * 2;

        const targetY =
          Math.round(
            state.targetRotY /
              TWO_PI
          ) *
          TWO_PI;


        if (
          typeof gsap !== "undefined"
        ) {

          gsap.to(
            state,
            {
              targetRotY:
                targetY,

              duration:
                1.1,

              ease:
                "power3.inOut"
            }
          );

        } else {

          state.targetRotY =
            targetY;
        }
      }
    );
  }


  /* ================================================================
     NAV 1 / 2 / 3
     ================================================================ */

  navLinks.forEach(
    link => {

      if (
        !link.dataset.page
      ) {
        return;
      }


      link.addEventListener(
        "click",
        e => {

          e.preventDefault();

          const page =
            parseInt(
              link.dataset.page
            );

          if (page === 2) {
            closeFocus();
            openPersonalPage();
            setActiveNav(link);
            return;
          }

          if (page === 1) {
            if (personalMode) {
              closePersonalPage();
            }
            closeFocus();
            setActiveNav(link);
          } else {
            closeFocus();
            setActiveNav(link);
          }


          const angles = {

            1: 0,

            2:
              (
                Math.PI * 2
              ) / 3,

            3:
              (
                Math.PI * 4
              ) / 3
          };


          const target =
            angles[page] !==
            undefined
              ? angles[page]
              : 0;


          if (
            typeof gsap !== "undefined"
          ) {

            gsap.to(
              state,
              {
                targetRotY:
                  target,

                duration:
                  1.1,

                ease:
                  "power3.inOut"
              }
            );

          } else {

            state.targetRotY =
              target;
          }
        }
      );
    }
  );


  /* ================================================================
     CUSTOM CURSOR
     ================================================================ */

  if (
    !IS_TOUCH &&
    cursor
  ) {

    let curX =
      vw / 2;

    let curY =
      vh / 2;

    let targetX =
      curX;

    let targetY =
      curY;


    window.addEventListener(
      "mousemove",
      e => {

        targetX =
          e.clientX;

        targetY =
          e.clientY;
      },
      { passive: true }
    );


    function cursorTick() {

      curX +=
        (
          targetX -
          curX
        ) *
        0.22;

      curY +=
        (
          targetY -
          curY
        ) *
        0.22;


      cursor.style.transform =
        `
        translate(
          ${curX.toFixed(1)}px,
          ${curY.toFixed(1)}px
        )
        `;


      requestAnimationFrame(
        cursorTick
      );
    }


    requestAnimationFrame(
      cursorTick
    );


    document
      .querySelectorAll(
        ".card, button, a, .detail-panel"
      )
      .forEach(
        el => {

          el.addEventListener(
            "mouseenter",
            () => {

              cursor.classList.add(
                "is-hover"
              );
            }
          );

          el.addEventListener(
            "mouseleave",
            () => {

              cursor.classList.remove(
                "is-hover"
              );
            }
          );
        }
      );

  } else if (
    cursor
  ) {

    cursor.style.display =
      "none";
  }


  /* ================================================================
     AMBIENT PARTICLES
     ================================================================ */

  if (
    ambientCanvas
  ) {

    const ctx =
      ambientCanvas.getContext(
        "2d"
      );

    let canvasW =
      ambientCanvas.width =
        window.innerWidth;

    let canvasH =
      ambientCanvas.height =
        window.innerHeight;


    window.addEventListener(
      "resize",
      () => {

        canvasW =
          ambientCanvas.width =
            window.innerWidth;

        canvasH =
          ambientCanvas.height =
            window.innerHeight;
      },
      { passive: true }
    );


    const particles =
      Array.from(
        {
          length: 28
        },
        () => ({

          x:
            Math.random() *
            canvasW,

          y:
            Math.random() *
            canvasH,

          r:
            Math.random() *
              1.2 +
            0.3,

          o:
            Math.random() *
              0.25 +
            0.08,

          sy:
            Math.random() *
              0.16 +
            0.05,

          ss:
            Math.random() *
              0.008 +
            0.003,

          sd:
            Math.random() *
              0.5 +
            0.2,

          a:
            Math.random() *
            Math.PI *
            2
        })
      );


    function ambientTick() {

      ctx.clearRect(
        0,
        0,
        canvasW,
        canvasH
      );


      particles.forEach(
        p => {

          p.y -= p.sy;

          p.a += p.ss;


          const px =
            p.x +
            Math.sin(
              p.a
            ) *
            p.sd;


          if (
            p.y <
            -10
          ) {

            p.y =
              canvasH +
              10;

            p.x =
              Math.random() *
              canvasW;
          }


          ctx.fillStyle =
            `rgba(
              145,
              135,
              125,
              ${p.o.toFixed(3)}
            )`;


          ctx.beginPath();

          ctx.arc(
            px,
            p.y,
            p.r,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      );


      requestAnimationFrame(
        ambientTick
      );
    }


    requestAnimationFrame(
      ambientTick
    );
  }

  /* ================================================================
     TAB 2 — PERSONAL FLOWER EXPERIENCE
     ADDITIVE ONLY: archive state/animation is preserved.

     Interaction:
     - Wheel over the archive/cards keeps the existing photo rotation.
     - Wheel DOWN from the left/right edge enters the personal page.
     - Wheel UP from the left/right edge returns to the archive.
     - "Your Flower" navigation opens the same page.
     - Name input deterministically selects one of the existing flowers.
     ================================================================ */

  const personalPage =
    document.getElementById("personal-page");

  const personalIntro =
    personalPage
      ? personalPage.querySelector(".florea-personal-intro")
      : null;

  const personalResult =
    document.getElementById("personal-result");

  const personalNameInput =
    document.getElementById("personal-name-input");

  const personalContinue =
    document.getElementById("personal-continue");

  const personalAgain =
    document.getElementById("personal-again");

  const personalBack =
    document.getElementById("personal-back");

  const personalMobileToggle =
    document.getElementById("personal-mobile-toggle");

  const personalHint =
    personalPage
      ? personalPage.querySelector(".florea-personal-field__hint")
      : null;

  const personalOutName =
    document.getElementById("personal-out-name");

  const personalOutFlower =
    document.getElementById("personal-out-flower");

  const personalOutLatin =
    document.getElementById("personal-out-latin");

  const personalOutMeaning =
    document.getElementById("personal-out-meaning");

  const personalOutEmotion =
    document.getElementById("personal-out-emotion");

  const personalOutSymbolism =
    document.getElementById("personal-out-symbolism");

  const personalOutOrigin =
    document.getElementById("personal-out-origin");

  const personalOutSpecimen =
    document.getElementById("personal-out-specimen");

  const personalOutMessage =
    document.getElementById("personal-out-message");

  const personalFlowerImg =
    document.getElementById("personal-flower-img");

  const personalFlowerRef =
    document.getElementById("personal-flower-ref");

  const personalRevealEls =
    personalPage
      ? Array.from(
          personalPage.querySelectorAll("[data-personal-reveal]")
        )
      : [];

  const personalStaggerEls =
    personalPage
      ? Array.from(
          personalPage.querySelectorAll("[data-personal-stagger]")
        )
      : [];

  let personalMode = false;

  const PERSONAL_EDGE_ZONE = 0.18;
  const PERSONAL_SCROLL_THRESHOLD = 10;

  function setPersonalNavActive(active) {
    navLinks.forEach(link => {
      link.classList.remove("is-active");
    });

    const personalLink =
      document.getElementById("nav-personal");

    if (active && personalLink) {
      personalLink.classList.add("is-active");
    } else if (!active && navHome) {
      navHome.classList.add("is-active");
    }
  }

  function animatePersonalIntroIn() {
    if (!personalPage) return;

    if (typeof gsap !== "undefined") {
      gsap.killTweensOf([
        personalPage,
        ...personalRevealEls
      ]);

      gsap.set(personalRevealEls, {
        opacity: 0,
        y: 18
      });

      gsap.fromTo(
        personalPage,
        { opacity: 0, y: "100%" },
        {
          opacity: 1,
          y: "0%",
          duration: 0.8,
          ease: "power3.inOut",
          overwrite: true
        }
      );

      gsap.to(personalRevealEls, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.055,
        delay: 0.12,
        ease: "power3.out"
      });
    } else {
      personalPage.style.opacity = "1";
      personalPage.style.transform = "translateY(0)";
      personalRevealEls.forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    }
  }

  function openPersonalPage() {
    if (!personalPage || personalMode) return;

    personalMode = true;

    closeFocus();

    document.documentElement.classList.add(
      "florea-personal-mode"
    );

    personalPage.classList.add("is-visible");
    personalPage.setAttribute("aria-hidden", "false");

    setPersonalNavActive(true);

    /* Always begin at the clean name-entry screen. */
    if (personalIntro && personalResult) {
      personalIntro.style.display = "flex";
      personalResult.classList.remove("is-active");
    }

    if (personalPage.scrollTop !== 0) {
      personalPage.scrollTop = 0;
    }

    animatePersonalIntroIn();

    window.dispatchEvent(
      new CustomEvent("florea:personal-open")
    );
  }

  function closePersonalPage() {
    if (!personalPage || !personalMode) return;

    personalMode = false;

    document.documentElement.classList.remove(
      "florea-personal-mode"
    );

    setPersonalNavActive(false);

    if (typeof gsap !== "undefined") {
      gsap.killTweensOf(personalPage);

      gsap.to(personalPage, {
        opacity: 0,
        yPercent: 100,
        duration: 0.65,
        ease: "power3.inOut",
        onComplete: () => {
          if (!personalMode) {
            personalPage.classList.remove("is-visible");
            personalPage.setAttribute("aria-hidden", "true");
          }
        }
      });
    } else {
      personalPage.style.opacity = "0";
      personalPage.style.transform = "translateY(100%)";
      personalPage.classList.remove("is-visible");
      personalPage.setAttribute("aria-hidden", "true");
    }

    window.dispatchEvent(
      new CustomEvent("florea:personal-close")
    );
  }

  function hashName(value) {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      hash =
        ((hash << 5) - hash + value.charCodeAt(i)) |
        0;
    }

    return Math.abs(hash);
  }

  function buildPersonalSpecimen(name) {
    if (!name || !cardData.length) return null;

    const cleanName =
      name.trim().replace(/\s+/g, " ");

    const index =
      hashName(cleanName.toLowerCase()) %
      cardData.length;

    const card = cards[index];
    const d = cardData[index];

    return {
      index,
      card,
      data: d,
      name: cleanName,
      flower:
        card.dataset.name || "Botanical Specimen",
      latin:
        card.dataset.latin || "",
      meaning:
        card.dataset.meaning || "",
      emotion:
        card.dataset.emotion || "",
      symbolism:
        card.dataset.symbolism || "",
      origin:
        card.dataset.origin || "",
      specimen:
        card.dataset.specimen || "",
      image:
        card.dataset.image || "",
      secondary:
        card.dataset.secondary || ""
    };
  }

  function renderPersonalSpecimen(specimen) {
    if (!specimen) return;

    if (personalOutName)
      personalOutName.textContent =
        specimen.name.toUpperCase();

    if (personalOutFlower)
      personalOutFlower.textContent =
        specimen.flower;

    if (personalOutLatin)
      personalOutLatin.textContent =
        specimen.latin;

    if (personalOutMeaning)
      personalOutMeaning.textContent =
        specimen.meaning
          ? `"${specimen.meaning}"`
          : "";

    if (personalOutEmotion)
      personalOutEmotion.textContent =
        specimen.emotion;

    if (personalOutSymbolism)
      personalOutSymbolism.textContent =
        specimen.symbolism;

    if (personalOutOrigin)
      personalOutOrigin.textContent =
        specimen.origin;

    if (personalOutSpecimen)
      personalOutSpecimen.textContent =
        specimen.specimen;

    if (personalFlowerImg) {
      personalFlowerImg.src =
        specimen.image;

      personalFlowerImg.alt =
        specimen.flower;
    }

    if (personalFlowerRef)
      personalFlowerRef.textContent =
        specimen.specimen;

    if (personalOutMessage) {
      personalOutMessage.textContent =
        `${specimen.flower} carries the feeling of ${(
          specimen.emotion || "quiet emotion"
        ).toLowerCase()}. In the Floréa archive, your name finds its place among these botanical meanings.`;
    }
  }

  function showPersonalHint(message) {
    if (!personalHint) return;

    personalHint.textContent = message || "";

    if (message) {
      personalHint.classList.add("is-shown");
    } else {
      personalHint.classList.remove("is-shown");
    }
  }

  function showPersonalResult() {
    if (!personalNameInput) return;

    const name =
      personalNameInput.value.trim();

    if (!name) {
      showPersonalHint("PLEASE ENTER YOUR NAME");
      personalNameInput.focus();
      return;
    }

    showPersonalHint("");

    const specimen =
      buildPersonalSpecimen(name);

    if (!specimen) return;

    renderPersonalSpecimen(specimen);

    if (personalIntro) {
      if (typeof gsap !== "undefined") {
        gsap.to(personalIntro, {
          opacity: 0,
          y: -18,
          duration: 0.45,
          ease: "power2.inOut",
          onComplete: () => {
            if (personalIntro) {
              personalIntro.style.display = "none";
            }
          }
        });
      } else {
        personalIntro.style.display = "none";
      }
    }

    if (personalResult) {
      personalResult.classList.add("is-active");

      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          personalResult,
          {
            opacity: 0,
            y: 22
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            delay: 0.2,
            ease: "power3.out"
          }
        );

        gsap.fromTo(
          personalStaggerEls,
          {
            opacity: 0,
            y: 14
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.06,
            delay: 0.34,
            ease: "power3.out"
          }
        );
      }
    }
  }

  function resetPersonal() {
    if (personalResult)
      personalResult.classList.remove("is-active");

    if (personalIntro) {
      personalIntro.style.display = "flex";
      personalIntro.style.opacity = "1";
      personalIntro.style.transform = "none";
    }

    if (personalNameInput) {
      personalNameInput.value = "";
    }

    showPersonalHint("");

    animatePersonalIntroIn();

    if (personalNameInput) {
      window.setTimeout(() => {
        personalNameInput.focus();
      }, 180);
    }
  }

  if (personalContinue) {
    personalContinue.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();
        showPersonalResult();
      }
    );
  }

  if (personalNameInput) {
    personalNameInput.addEventListener(
      "keydown",
      e => {
        if (e.key === "Enter") {
          e.preventDefault();
          showPersonalResult();
        }
      }
    );

    personalNameInput.addEventListener(
      "input",
      () => {
        if (personalHint) {
          showPersonalHint("");
        }
      }
    );
  }

  if (personalAgain) {
    personalAgain.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();
        resetPersonal();
      }
    );
  }

  if (personalBack) {
    personalBack.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();
        closePersonalPage();
      }
    );
  }

  if (personalMobileToggle) {
    personalMobileToggle.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();

        if (personalMode) {
          closePersonalPage();
        } else {
          openPersonalPage();
        }
      }
    );
  }

  /*
   * EDGE SCROLL
   *
   * The existing wheel listener on #canvas-viewport remains untouched
   * for normal rotation. This capture listener intercepts ONLY a
   * vertical wheel gesture when the pointer is close to the left or
   * right edge. Therefore:
   *
   *   center/card + wheel = existing gallery rotation
   *   left/right edge + wheel down = Tab 2
   *   left/right edge + wheel up = archive
   */
  window.addEventListener(
    "wheel",
    e => {
      if (!personalPage) return;

      const xRatio =
        e.clientX /
        Math.max(1, window.innerWidth);

      const atEdge =
        xRatio <= PERSONAL_EDGE_ZONE ||
        xRatio >= 1 - PERSONAL_EDGE_ZONE;

      const verticalGesture =
        Math.abs(e.deltaY) >
        Math.abs(e.deltaX) * 0.85 &&
        Math.abs(e.deltaY) >=
          PERSONAL_SCROLL_THRESHOLD;

      if (!atEdge || !verticalGesture) {
        return;
      }

      if (
        !personalMode &&
        e.deltaY > 0 &&
        !state.intro &&
        !state.isFocused
      ) {
        e.preventDefault();
        e.stopPropagation();
        openPersonalPage();
        return;
      }

      if (
        personalMode &&
        e.deltaY < 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        closePersonalPage();
      }
    },
    {
      passive: false,
      capture: true
    }
  );

  /*
   * Also allow an upward wheel gesture anywhere on the personal page
   * to return to the archive. This does not alter archive wheel physics.
   */
  if (personalPage) {
    personalPage.addEventListener(
      "wheel",
      e => {
        if (
          !personalMode ||
          e.deltaY >= 0
        ) {
          return;
        }

        const atTop =
          personalPage.scrollTop <= 2;

        if (atTop) {
          e.preventDefault();
          closePersonalPage();
        }
      },
      {
        passive: false
      }
    );
  }

  /*
   * Keep the existing archive navigation active after returning.
   * No gallery rotation variables are reset here.
   */
  window.addEventListener(
    "florea:personal-close",
    () => {
      if (viewport) {
        viewport.style.pointerEvents = "";
      }
    }
  );


})();
/* ==========================================================
   FLORÉA — AMBIENT MUSIC CONTROLLER
   ========================================================== */

(() => {
  const music = document.getElementById('florea-music');
  const toggle = document.getElementById('music-toggle');

  if (!music || !toggle) return;

  const text = toggle.querySelector('.music-toggle__text');

  let playing = false;

  function updateMusicUI() {
    if (playing) {
      toggle.classList.add('is-playing');
      text.textContent = 'SOUND ON';
    } else {
      toggle.classList.remove('is-playing');
      text.textContent = 'SOUND OFF';
    }
  }

  async function startMusic() {
    try {
      music.volume = 0.28;

      await music.play();

      playing = true;
      updateMusicUI();
    } catch (error) {
      // Browser blocked autoplay — user can start it manually.
      playing = false;
      updateMusicUI();
    }
  }

  function stopMusic() {
    music.pause();
    playing = false;
    updateMusicUI();
  }

  toggle.addEventListener('click', async (event) => {
    event.stopPropagation();

    if (playing) {
      stopMusic();
    } else {
      await startMusic();
    }
  });

  /*
   * Start music after the user's first interaction.
   * This avoids browser autoplay restrictions.
   */
  const firstInteraction = async () => {
    if (!playing) {
      await startMusic();
    }

    document.removeEventListener('pointerdown', firstInteraction);
    document.removeEventListener('keydown', firstInteraction);
    document.removeEventListener('wheel', firstInteraction);
  };

  document.addEventListener('pointerdown', firstInteraction, {
    once: true,
    passive: true
  });

  document.addEventListener('keydown', firstInteraction, {
    once: true
  });

  document.addEventListener('wheel', firstInteraction, {
    once: true,
    passive: true
  });

  updateMusicUI();
})();