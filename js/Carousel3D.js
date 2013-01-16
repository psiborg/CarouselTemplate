/* ===========================================================================
 * Carousel3D.js
 *
 * Dave DeSandro (@desandro)
 * Jim Ing (@jim_ing)
 * ===========================================================================
 *
 * Copyright 2012-2013 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var transformProp = Modernizr.prefixed('transform');

function Carousel3D(el) {
    this.element = el;
    this.rotation = 0;
    this.panelCount = 0;
    this.totalPanelCount = this.element.children.length;
    this.theta = 0;
    this.isHorizontal = true;

    // Custom properties
    this.backgroundColor = 'rgba(214, 213, 213, 0.95)';
    this.sideIndex = 0;
    this.maximized = [];
    this.prevStyle = {};
}

Carousel3D.prototype.modify = function () {
    var panel, angle, i;
    this.panelSize = this.element[this.isHorizontal ? 'offsetWidth' : 'offsetHeight'];
    this.rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
    this.theta = 360 / this.panelCount;

    // Do some trig to figure out how big the carousel is in 3D space
    this.radius = Math.round((this.panelSize / 2) / Math.tan(Math.PI / this.panelCount));

    for (i = 0; i < this.panelCount; i++) {
        panel = this.element.children[i];
        angle = this.theta * i;
        panel.style.opacity = 1;
        //panel.style.backgroundColor = 'hsla(' + angle + ', 100%, 50%, 0.8)';
        panel.style.backgroundColor = this.backgroundColor;

        // Rotate panel, then push it out in 3D space
        panel.style[transformProp] = this.rotateFn + '(' + angle + 'deg) translateZ(' + this.radius + 'px)';
    }

    // Hide other panels
    for (; i < this.totalPanelCount; i++) {
        panel = this.element.children[i];
        panel.style.opacity = 0;
        panel.style[transformProp] = 'none';
    }

    // Adjust rotation so panels are always flat
    this.rotation = Math.round(this.rotation / this.theta) * this.theta;
    this.transform();
};

Carousel3D.prototype.transform = function () {
    // Push the carousel back in 3D space, and rotate it
    this.element.style[transformProp] = 'translateZ(-' + this.radius + 'px) ' + this.rotateFn + '(' + this.rotation + 'deg)';

    // Custom
    // Figure out which side we're on
    var n = Math.abs(Math.ceil(this.rotation / 360)) + 1;
    if (this.rotation <= 0) {
        this.sideIndex = Math.abs(this.panelCount - (n * this.panelCount) - (this.rotation / this.theta));
    }
    else {
        this.sideIndex = Math.abs((n * this.panelCount) - (this.rotation / this.theta) - this.panelCount);
    }
    console.log('rotation=' + this.rotation, 'n=' + n, 'sideIndex=' + this.sideIndex);
};
