/**
 * TagCloud.js (c) 2016-2019 @ Cong Min
 * MIT License - https://github.com/cong-min/TagCloud
 */

class TagCloud {
    /* constructor */
    constructor(container = document.body, texts, options) {
        const self = this;
        if (!container || container.nodeType !== 1) return new Error('Incorrect element type');

        // params
        self.$container = container;
        self.texts = texts || [];
        self.config = { ...TagCloud._defaultConfig, ...options || {} };

        // process texts and calculate weight range
        self._processTexts();

        // calculate container dimensions
        self._calculateDimensions();

        // calculate config based on container dimensions
        self.radius = Math.min(self.containerWidth, self.containerHeight) / 2; // rolling radius based on smaller dimension
        self.depth = 2 * self.radius; // rolling depth
        self.size = 1.5 * self.radius; // rolling area size with mouse
        self.maxSpeed = TagCloud._getMaxSpeed(self.config.maxSpeed); // rolling max speed
        self.initSpeed = TagCloud._getInitSpeed(self.config.initSpeed); // rolling init speed
        self.direction = self.config.direction; // rolling init direction
        self.keep = self.config.keep; // whether to keep rolling after mouse out area
        self.paused = false; // keep state to pause the animation

        // create element
        self._createElment();
        // init
        self._init();
        // set elements and instances
        TagCloud.list.push({ el: self.$el, container, instance: self });
    }

    /* static method */
    // all TagCloud list
    static list = [];

    // default config
    static _defaultConfig = {
        radius: 100, // rolling radius, unit `px` (deprecated, will be calculated from container size)
        width: null, // container width, if null will use parent container width
        height: null, // container height, if null will use parent container height
        maxSpeed: 'normal', // rolling max speed, optional: `slow`, `normal`(default), `fast`
        initSpeed: 'normal', // rolling init speed, optional: `slow`, `normal`(default), `fast`
        direction: 135, // rolling init direction, unit clockwise `deg`, optional: `0`(top) , `90`(left), `135`(right-bottom)(default)...
        keep: true, // whether to keep rolling after mouse out area, optional: `false`, `true`(default)(decelerate to rolling init speed, and keep rolling with mouse)
        reverseDirection: false,
        useContainerInlineStyles: true,
        useItemInlineStyles: true,
        containerClass: 'tagcloud',
        itemClass: 'tagcloud--item',
        useHTML: false,
        minFontSize: 12, // minimum font size in px
        maxFontSize: 12, // maximum font size in px
        hls: false, // whether to use HSL color based on weight
        autoResize: true, // whether to automatically resize when container size changes
    };

    // speed value
    static _getMaxSpeed = (name) => ({ slow: 0.5, normal: 1, fast: 2 })[name] || 1;

    static _getInitSpeed = (name) => ({ slow: 16, normal: 32, fast: 80 })[name] || 32;

    // calculate font size based on weight
    _calculateFontSize(weight, minWeight, maxWeight) {
        const self = this;
        const { minFontSize, maxFontSize } = self.config;

        // if min and max font size are the same, return the same size
        if (minFontSize === maxFontSize) {
            return minFontSize;
        }

        // if there's only one item or all weights are the same
        if (minWeight === maxWeight) {
            return minFontSize;
        }

        // calculate proportional font size
        const ratio = (weight - minWeight) / (maxWeight - minWeight);
        return minFontSize + (maxFontSize - minFontSize) * ratio;
    }

    // calculate color based on weight
    _getColorByWeight(weight, minWeight, maxWeight) {
        // normalize to [0, 1]
        let ratio = (weight - minWeight) / (maxWeight - minWeight);

        // handle edge cases
        if (minWeight === maxWeight) {
            ratio = 0.5; // use middle color for same weights
        }

        // color transition from cool to warm
        // 240° (blue) → 180° (cyan) → 120° (green) → 60° (yellow) → 0° (red)
        const hue = 240 - ratio * 240; // 240° to 0°
        const saturation = 60 + ratio * 40; // 60% → 100%
        const lightness = 65 - ratio * 30; // 65% → 35%

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // calculate container dimensions
    _calculateDimensions() {
        const self = this;

        // Get dimensions from config first, then fallback to parent container
        if (self.config.width && self.config.height) {
            self.containerWidth = self.config.width;
            self.containerHeight = self.config.height;
        } else {
            // Get parent container computed style
            const containerStyle = window.getComputedStyle(self.$container);
            const containerWidth = self.$container.clientWidth
                || parseInt(containerStyle.width, 10)
                || self.config.width
                || 300; // fallback default
            const containerHeight = self.$container.clientHeight
                || parseInt(containerStyle.height, 10)
                || self.config.height
                || 300; // fallback default

            self.containerWidth = containerWidth;
            self.containerHeight = containerHeight;
        }
    }

    // process texts data and calculate weight range
    _processTexts() {
        const self = this;

        // normalize texts to object format
        self.processedTexts = self.texts.map(item => {
            if (typeof item === 'string') {
                return { text: item, pr: 0 }; // non-object types default to pr: 0
            } else if (typeof item === 'object' && item.text !== undefined) {
                return { text: item.text, pr: item.pr !== undefined ? item.pr : 1 };
            }
            return { text: String(item), pr: 0 }; // non-object types default to pr: 0
        });

        // calculate weight range
        if (self.processedTexts.length > 0) {
            const weights = self.processedTexts.map(item => item.pr);
            self.minWeight = Math.min(...weights);
            self.maxWeight = Math.max(...weights);
        } else {
            self.minWeight = 1;
            self.maxWeight = 1;
        }
    }

    // event listener
    static _on(el, ev, handler, cap) {
        if (el.addEventListener) {
            el.addEventListener(ev, handler, cap);
        } else if (el.attachEvent) {
            el.attachEvent(`on${ev}`, handler);
        } else {
            el[`on${ev}`] = handler;
        }
    }

    /* instance property method */
    // create elment
    _createElment() {
        const self = this;

        // create container
        const $el = document.createElement('div');
        $el.className = self.config.containerClass;
        if (self.config.useContainerInlineStyles) {
            $el.style.position = 'relative';
            $el.style.width = `${self.containerWidth}px`;
            $el.style.height = `${self.containerHeight}px`;
        }

        // create texts
        self.items = [];
        self.processedTexts.forEach((textObj, index) => {
            const item = self._createTextItem(textObj, index);
            $el.appendChild(item.el);
            self.items.push(item);
        });
        self.$container.appendChild($el);
        self.$el = $el;
    }

    // create a text
    _createTextItem(textObj, index = 0) {
        const self = this;
        const itemEl = document.createElement('span');
        itemEl.className = self.config.itemClass;

        // calculate font size based on weight
        const fontSize = self._calculateFontSize(textObj.pr, self.minWeight, self.maxWeight);

        if (self.config.useItemInlineStyles) {
            itemEl.style.willChange = 'transform, opacity, filter';
            itemEl.style.position = 'absolute';
            itemEl.style.top = '50%';
            itemEl.style.left = '50%';
            itemEl.style.zIndex = index + 1;
            itemEl.style.filter = 'alpha(opacity=0)';
            itemEl.style.opacity = 0;
            itemEl.style.fontSize = `${fontSize}px`;

            // apply color based on weight if hls is enabled
            if (self.config.hls) {
                const color = self._getColorByWeight(textObj.pr, self.minWeight, self.maxWeight);
                itemEl.style.color = color;
            }
            const transformOrigin = '50% 50%';
            itemEl.style.WebkitTransformOrigin = transformOrigin;
            itemEl.style.MozTransformOrigin = transformOrigin;
            itemEl.style.OTransformOrigin = transformOrigin;
            itemEl.style.transformOrigin = transformOrigin;
            const transform = 'translate3d(-50%, -50%, 0) scale(1)';
            itemEl.style.WebkitTransform = transform;
            itemEl.style.MozTransform = transform;
            itemEl.style.OTransform = transform;
            itemEl.style.transform = transform;
        }
        if (self.config.useHTML) {
            itemEl.innerHTML = textObj.text;
        } else {
            itemEl.innerText = textObj.text;
        }
        return {
            el: itemEl,
            weight: textObj.pr,
            ...self._computePosition(index), // distributed in appropriate place
        };
    }

    // calculate appropriate place
    _computePosition(index, random = false) {
        const self = this;
        const textsLength = self.processedTexts.length;
        // if random `true`, It means that a random appropriate place is generated, and the position will be independent of `index`
        if (random) index = Math.floor(Math.random() * (textsLength + 1));
        // Calculate ellipsoid distribution based on container dimensions
        const phi = Math.acos(-1 + (2 * index + 1) / textsLength);
        const theta = Math.sqrt((textsLength + 1) * Math.PI) * phi;

        // Scale factors for ellipsoid shape
        const scaleX = self.containerWidth / (2 * self.radius);
        const scaleY = self.containerHeight / (2 * self.radius);
        const scaleZ = 1; // keep Z axis as sphere for depth effect
        return {
            x: (self.size * Math.cos(theta) * Math.sin(phi) * scaleX) / 2,
            y: (self.size * Math.sin(theta) * Math.sin(phi) * scaleY) / 2,
            z: (self.size * Math.cos(phi) * scaleZ) / 2,
        };
    }

    _requestInterval(fn, delay) {
        const requestAnimFrame = ((() => window.requestAnimationFrame) || ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        }))();
        let start = new Date().getTime();
        const handle = {};
        function loop() {
            handle.value = requestAnimFrame(loop);
            const current = new Date().getTime(),
                delta = current - start;
            if (delta >= delay) {
                fn.call();
                start = new Date().getTime();
            }
        }
        handle.value = requestAnimFrame(loop);
        return handle;
    }

    // init
    _init() {
        const self = this;

        self.active = false; // whether the mouse is activated

        self.mouseX0 = self.initSpeed * Math.sin(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center x axis
        self.mouseY0 = -self.initSpeed * Math.cos(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center y axis

        self.mouseX = self.mouseX0; // current distance between the mouse and rolling center x axis
        self.mouseY = self.mouseY0; // current distance between the mouse and rolling center y axis

        const isTouchDevice = window.matchMedia('(hover: hover)');
        if (!isTouchDevice || isTouchDevice.matches) {
            // mouseover
            TagCloud._on(self.$el, 'mouseover', () => { self.active = true; });
            // mouseout
            TagCloud._on(self.$el, 'mouseout', () => { self.active = false; });
            // mousemove
            TagCloud._on(self.keep ? window : self.$el, 'mousemove', (ev) => {
                ev = ev || window.event;
                const rect = self.$el.getBoundingClientRect();
                self.mouseX = (ev.clientX - (rect.left + rect.width / 2)) / 5;
                self.mouseY = (ev.clientY - (rect.top + rect.height / 2)) / 5;
            });
        }

        // update state regularly
        self._next(); // init update state
        self.interval = self._requestInterval(() => {
            self._next.call(self);
        }, 10);

        // setup auto resize observer if enabled
        if (self.config.autoResize) {
            self._setupResizeObserver();
        }
    }

    // setup resize observer to watch container size changes
    _setupResizeObserver() {
        const self = this;

        // Check if ResizeObserver is supported
        if (typeof window.ResizeObserver !== 'undefined') {
            self.resizeObserver = new window.ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === self.$container) {
                        const newWidth = entry.contentRect.width
                            || self.$container.clientWidth;
                        const newHeight = entry.contentRect.height
                            || self.$container.clientHeight;

                        // Only resize if dimensions actually changed
                        const widthChanged = newWidth !== self.containerWidth;
                        const heightChanged = newHeight !== self.containerHeight;
                        if (widthChanged || heightChanged) {
                            self._handleResize(newWidth, newHeight);
                        }
                    }
                }
            });

            self.resizeObserver.observe(self.$container);
        } else {
            // Fallback to window resize event for older browsers
            TagCloud._on(window, 'resize', () => {
                const newWidth = self.$container.clientWidth;
                const newHeight = self.$container.clientHeight;
                const widthChanged = newWidth !== self.containerWidth;
                const heightChanged = newHeight !== self.containerHeight;
                if (widthChanged || heightChanged) {
                    self._handleResize(newWidth, newHeight);
                }
            });
        }
    }

    // handle container resize
    _handleResize(newWidth, newHeight) {
        const self = this;

        // Add minimum change threshold to prevent tiny fluctuations
        const minChangeThreshold = 1; // 1px minimum change
        const widthDiff = Math.abs(newWidth - self.containerWidth);
        const heightDiff = Math.abs(newHeight - self.containerHeight);

        if (widthDiff < minChangeThreshold && heightDiff < minChangeThreshold) {
            return; // Skip if change is too small
        }

        // Add debouncing to prevent rapid successive calls
        if (self._resizeTimeout) {
            clearTimeout(self._resizeTimeout);
        }

        self._resizeTimeout = setTimeout(() => {
            self._performResize(newWidth, newHeight);
            self._resizeTimeout = null;
        }, 16); // ~60fps debouncing
    }

    // perform the actual resize operation
    _performResize(newWidth, newHeight) {
        const self = this;

        // Update container dimensions
        self.containerWidth = newWidth;
        self.containerHeight = newHeight;

        // Recalculate radius and size based on new dimensions
        self.radius = Math.min(self.containerWidth, self.containerHeight) / 2;
        self.depth = 2 * self.radius;
        self.size = 1.5 * self.radius;

        // Only update TagCloud element size if it won't affect parent container
        // Avoid setting size on TagCloud element if parent container size is auto
        if (self.config.useContainerInlineStyles) {
            // Check if we should update the element size
            const parentStyle = window.getComputedStyle(self.$container);
            const parentHasFixedWidth = parentStyle.width !== 'auto'
                && !parentStyle.width.includes('%');
            const parentHasFixedHeight = parentStyle.height !== 'auto'
                && !parentStyle.height.includes('%');

            // Only set dimensions if parent has fixed size to prevent feedback loops
            if (parentHasFixedWidth || self.config.width) {
                self.$el.style.width = `${self.containerWidth}px`;
            }
            if (parentHasFixedHeight || self.config.height) {
                self.$el.style.height = `${self.containerHeight}px`;
            }
        }

        // Recalculate all item positions
        self.items.forEach((item, index) => {
            const newPosition = self._computePosition(index);
            item.x = newPosition.x;
            item.y = newPosition.y;
            item.z = newPosition.z;
        });
    }

    // calculate the next state
    _next() {
        const self = this;

        if (self.paused) {
            return;
        }

        // if keep `false`, pause rolling after moving mouse out area
        if (!self.keep && !self.active) {
            self.mouseX = Math.abs(self.mouseX - self.mouseX0) < 1
                ? self.mouseX0 : (self.mouseX + self.mouseX0) / 2; // reset distance between the mouse and rolling center x axis
            self.mouseY = Math.abs(self.mouseY - self.mouseY0) < 1
                ? self.mouseY0 : (self.mouseY + self.mouseY0) / 2; // reset distance between the mouse and rolling center y axis
        }

        let a = -(Math.min(Math.max(-self.mouseY, -self.size), self.size) / self.radius)
            * self.maxSpeed;
        let b = (Math.min(Math.max(-self.mouseX, -self.size), self.size) / self.radius)
            * self.maxSpeed;

        // inverse direction if enabled
        if (self.config.reverseDirection) {
            a = -a;
            b = -b;
        }

        if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) return; // pause

        // calculate offset
        const l = Math.PI / 180;
        const sc = [
            Math.sin(a * l),
            Math.cos(a * l),
            Math.sin(b * l),
            Math.cos(b * l)
        ];

        self.items.forEach(item => {
            const rx1 = item.x;
            const ry1 = item.y * sc[1] + item.z * (-sc[0]);
            const rz1 = item.y * sc[0] + item.z * sc[1];

            const rx2 = rx1 * sc[3] + rz1 * sc[2];
            const ry2 = ry1;
            const rz2 = rz1 * sc[3] - rx1 * sc[2];

            const per = (2 * self.depth) / (2 * self.depth + rz2); // todo

            item.x = rx2;
            item.y = ry2;
            item.z = rz2;
            item.scale = per.toFixed(3);
            let alpha = per * per - 0.25;
            alpha = (alpha > 1 ? 1 : alpha).toFixed(3);

            const itemEl = item.el;
            const left = (item.x - itemEl.offsetWidth / 2).toFixed(2);
            const top = (item.y - itemEl.offsetHeight / 2).toFixed(2);
            const transform = `translate3d(${left}px, ${top}px, 0) scale(${item.scale})`;
            itemEl.style.WebkitTransform = transform;
            itemEl.style.MozTransform = transform;
            itemEl.style.OTransform = transform;
            itemEl.style.transform = transform;
            itemEl.style.filter = `alpha(opacity=${100 * alpha})`;
            itemEl.style.opacity = alpha;
        });
    }

    /* export instance properties and methods */
    // update
    update(texts) {
        const self = this;
        // params
        self.texts = texts || [];
        // process new texts and recalculate weight range
        self._processTexts();

        // judging and processing items based on texts
        self.processedTexts.forEach((textObj, index) => {
            let item = self.items[index];
            if (!item) { // if not had, then create
                item = self._createTextItem(textObj, index);
                Object.assign(item, self._computePosition(index, true)); // random place
                self.$el.appendChild(item.el);
                self.items.push(item);
            } else {
                // if had, replace text and update font size
                const fontSize = self._calculateFontSize(
                    textObj.pr, self.minWeight, self.maxWeight
                );
                if (self.config.useItemInlineStyles) {
                    item.el.style.fontSize = `${fontSize}px`;

                    // apply color based on weight if hls is enabled
                    if (self.config.hls) {
                        const color = self._getColorByWeight(
                            textObj.pr, self.minWeight, self.maxWeight
                        );
                        item.el.style.color = color;
                    }
                }
                if (self.config.useHTML) {
                    item.el.innerHTML = textObj.text;
                } else {
                    item.el.innerText = textObj.text;
                }
                item.weight = textObj.pr;
            }
        });
        // remove redundant self.items
        const textsLength = self.processedTexts.length;
        const itemsLength = self.items.length;
        if (textsLength < itemsLength) {
            const removeList = self.items.splice(textsLength, itemsLength - textsLength);
            removeList.forEach(item => {
                self.$el.removeChild(item.el);
            });
        }
    }

    // destroy
    destroy() {
        const self = this;
        self.interval = null;

        // cleanup resize observer
        if (self.resizeObserver) {
            self.resizeObserver.disconnect();
            self.resizeObserver = null;
        }

        // cleanup resize timeout
        if (self._resizeTimeout) {
            clearTimeout(self._resizeTimeout);
            self._resizeTimeout = null;
        }

        // clear in TagCloud.list
        const index = TagCloud.list.findIndex(e => e.el === self.$el);
        if (index !== -1) TagCloud.list.splice(index, 1);
        // clear element
        if (self.$container && self.$el) {
            self.$container.removeChild(self.$el);
        }
    }

    pause() {
        const self = this;

        self.paused = true;
    }

    resume() {
        const self = this;

        self.paused = false;
    }
}

export default (els, texts, options) => {
    if (typeof els === 'string') els = document.querySelectorAll(els);
    if (!els.forEach) els = [els];
    const instances = [];
    els.forEach(el => {
        if (el) {
            instances.push(new TagCloud(el, texts, options));
        }
    });
    return instances.length <= 1 ? instances[0] : instances;
};
