(function (global) {

    let globalMsg = {
        targetId: null,
        mouseLeftDown: false,
        triggerCreateSVGFinish: false,
    }

    function SVGTool(options) {
        Assert.isTrue(Object.prototype.toString.call(SVG) === '[object Function]', "depend on svg.js")

        let svg = {
            params: null,
            instance: null,
            handler: null,
            setCreatePluginName(_name, _always) {
                this.handler.methods.setCreatePluginName(_name, _always)
            },
            updateParam(_param) {
                this.instance.updateParam(_param)
            },
            reset() {
                this.handler.methods.clearCreatePluginName()
            }
        }
        svg.params = SvgParams(options)
        svg.instance = SvgInstance(svg.params)
        svg.handler = SvgHandler(svg.instance, svg.params)

        return svg
    }

////////////////////// param
    function SvgParams(options) {
        return {
            width: options.width || '100%',
            height: options.height || '100%',
            elementId: options.elementId, //
            maxScale: options.maxScale || 15, // 放大缩小的最大值 1500%
            minScale: options.minScale || 0.02, // 2%

            guidelineColor: options.guidelineColor || '#3366CC',
            openGuideline: options.openGuideline,
            plugins: options.plugins || [],
            events: options.events
        }
    }

////////////////////// instance
    function SvgInstance(_params) {
        let instance = {
            elementId: _params.elementId || 'drawing',
            svgDraw: SvgDraw(_params),
            group: SvgGroup(_params),
            position: {
                current: SvgPosition(), // 当前点的位置
                last: SvgPosition(), // 上一次的位置点，current-last 可以计算
                end: SvgPosition(), // mouseup 时的结束点信息
                mouseWheel: SvgPosition() // 滚轮事件的位置点，缩放的点
            },
            data: {
                generateId: 0,// 自增的id，用于给rect等svg对象赋值id
                // currentSvgElement: null // 当前的svg对象
            },

            init() {
                this.svgDraw.init(this.elementId)
                this.group.init(this.getDraw())
                return this
            },
            updateParam(_param) {
                this.group.updateParam(_param)
            },
            getDraw() {
                return this.svgDraw.getDraw();
            },
            showGuideline() {
                this.group.showGuideline(this.getCurrentPosition())
                return this
            },
            hideGuideline() {
                this.group.hideGuideline()
                return this
            },
            render(_p) {                 // 渲染svg
                this.group.render(_p)
                return this
            },
            addSvgInGroup(_svgElement) {
                this.group.addElement(_svgElement)
                return this
            },
            setCurrentPosition(e) {
                this.position.current.setPosition(e, this.group.getZoom())
                return this
            },
            setMouseWheelPosition(e) {
                this.position.mouseWheel.setPosition(e, this.group.getZoom())
                return this
            },
            setLastPosition(e) {
                this.position.last.setPosition(e, this.group.getZoom())
                return this
            },
            setEndPosition(e) {
                this.position.end.setPosition(e, this.group.getZoom())
                return this
            },
            getEndPosition() {
                return this.position.end
            },
            getCurrentPosition() {
                return this.position.current
            },
            getLastPosition() {
                return this.position.last
            },
            calculatePosition(e) {
                return this.position.current.calculatePosition(e, this.group.getZoom())
            },
            getGenerateId() {
                return this.data.generateId++;
            },
            getRawGroup() {
                return this.group.getGroup();
            },
            addSvgElement(svgElement, pluginName) {
                Assert.isTrue(pluginName !== undefined, "plugin is not undefined")
                svgElement.addClass('_svg').data('tag', '_svg').data('plugin', pluginName)
                this.group.addElement(svgElement)
                return svgElement
            },
            addSvgPoint(svgPoint, pluginName) {
                Assert.isTrue(pluginName !== undefined, "plugin is not undefined")
                svgPoint.addClass('_point').data('tag', '_point').data('plugin', pluginName)
                this.group.addElement(svgPoint)
                return svgPoint
            },
            removeAllPoints() {
                SVGUtil.removeAllPoints()
            },
            removePoint(_id) {
                SVGUtil.removeSVGById(_id)
            },
            removeSVGById(_id) {
                SVGUtil.removeSVGById(_id)
            },
            mouseStyle(_style) {
                SVGUtil.mouseStyle(this.group.id, _style)
            },
            isSvgElement(e) {
                return SVGUtil.isSvgElement(e)
            },
            getSVGById(_id) {
                return SVGUtil.getSVGById(_id)
            },
            isSvgPoint(e) {
                return SVGUtil.isSvgPoint(e)
            },
            createSVGFinish() {
                globalMsg.triggerCreateSVGFinish = true
            },
            // 通用鼠标样式控制，依据鼠标与point圆心的相对位置进行变化
            commonPointMouseStyle(e) {
                // 变换鼠标指针
                if (instance.isSvgPoint(e)) {
                    let currPosition = instance.calculatePosition(e)
                    let circlePoint = instance.getSVGById(e.target.id)
                    if (currPosition.rx > circlePoint.cx() && currPosition.ry < circlePoint.cy() ||
                        currPosition.rx < circlePoint.cx() && currPosition.ry > circlePoint.cy()) {
                        instance.mouseStyle('ne-resize') // 右斜
                    } else if (currPosition.rx < circlePoint.cx() && currPosition.ry < circlePoint.cy() ||
                        currPosition.rx > circlePoint.cx() && currPosition.ry > circlePoint.cy()) {
                        instance.mouseStyle('se-resize') // 左斜
                    } else if (currPosition.rx == circlePoint.cx() && currPosition.ry != circlePoint.cy()) {
                        instance.mouseStyle('s-resize') // 垂直
                    } else if (currPosition.rx != circlePoint.cx() && currPosition.ry == circlePoint.cy()) {
                        instance.mouseStyle('w-resize') // 水平
                    } else {
                        instance.mouseStyle('move')
                    }
                }
            },
            commonPointMouseStyleDefault(e) {
                if (instance.isSvgPoint(e)) instance.mouseStyle('default')
            }
        }

        return instance.init()
    }

////////////////////// group
    function SvgGroup(_params) {
        let group = { // 包含image的svg以及其他图形的svg对象的group组，用于统一的缩放
            id: '_defaultGroup',
            default: null,
            openGuideline: _params.openGuideline === undefined ? true : _params.openGuideline,
            guideline: SvgGuideline(_params),
            x: 0,
            y: 0,
            zoom: {
                max: _params.maxScale || 15,         // 放大缩小的最大值 1500%
                min: _params.minScale || 0.02,       // 2%
                scale: 1,
            },
            init(_draw) {
                // 设置默认组，用于整体的缩放
                this.default = _draw.group().id(this.id)
                this.guideline.init(this.default)
            },
            updateParam(_p) {
                this.openGuideline = _p.openGuideline || this.openGuideline
                this.zoom.max = _params.maxScale || this.zoom.max
                this.zoom.min = _params.minScale || this.zoom.min
                this.guideline.updateParam(_p)
            },
            getScale() {
                return this.zoom.scale
            },
            setScale(s) {
                if (s > this.zoom.max) s = this.zoom.max
                if (s < this.zoom.min) s = this.zoom.min
                this.zoom.scale = s
                return this
            },
            addScale(_increment) {
                return this.setScale(this.getScale() + _increment)
            },
            setXY(x, y) {
                this.x = x ? x : this.x
                this.y = y ? y : this.y
                return this
            },
            transform(s, x, y) {
                this.default.transform(new SVG.Matrix(s, 0, 0, s, x, y))
                return this
            },
            getGroup() {
                return this.default;
            },
            showGuideline(_currPosition) {
                if (this.openGuideline) this.guideline.show(_currPosition, this.default)
            },
            hideGuideline() {
                this.guideline.hide()
            },
            addElement(_svgElement) {
                this.default.add(_svgElement)
            },
            getZoom() {
                return {scale: this.zoom.scale, x: this.x, y: this.y}
            },
            render(_zoom) {
                if (!_zoom) _zoom = this.getZoom()
                else this.setScale(_zoom.scale).setXY(_zoom.x, _zoom.y)
                this.transform(_zoom.scale, _zoom.x, _zoom.y)
                return this
            }
        }
        return group
    }

////////////////////// draw
    function SvgDraw(_params) {
        return { // svg 的实例对象
            id: '_drawing',
            draw: null,
            getDraw() {
                return this.draw;
            },
            init(_elementId) {
                this.draw = SVG().addTo("#" + _elementId).size(_params.width, _params.height).id(this.id)
            }
        }
    }

////////////////////// event
    // 事件处理
    function SvgHandler(_instance, _params) {
        let _plugins = _params.plugins
        let _handler = {
            spec: {
                pluginName: null, // 当前被调用者的名称
                lock: false,
                pluginNameOfCreateSVG: null,
                createLock: false
            },
            init() {
                this.methods.removeEvents()
                    .bindCoreEvent('click')
                    .bindCoreEvent('dblclick')
                    .bindCoreEvent('mousedown')
                    .bindCoreEvent('mousemove')
                    .bindCoreEvent('mouseup')
                    .bindCoreEvent('mouseover')
                    .bindCoreEvent('mouseout')
                    .bindCoreEvent('mouseleave')
                    .bindCoreEvent('mousewheel')

                // 声明监听器
                Object.defineProperty(globalMsg, 'triggerCreateSVGFinish', {
                    get: function () {
                        return triggerCreateSVGFinish;
                    },
                    set: function () {
                        if (_handler.spec.createLock == false) {
                            _handler.methods.clearCreatePluginName()
                        }
                    }
                })
            },
            plugins: {},
            coreEvents: {
                dblclick(e) {
                    _handler.methods.triggerEvent('dblclick', e)
                },
                click(e) {
                    _handler.methods.triggerEvent('click', e)
                },
                mousedown(e) {
                    _instance.setLastPosition(e)
                    if (e.button == 0) {// 鼠标左键
                        _instance.showGuideline()
                        globalMsg.mouseLeftDown = true
                    }
                    if (SVGUtil.isSvgElement(e)) globalMsg.targetId = e.target.id
                    e.stopPropagation(); // 阻止冒泡
                    e.preventDefault(); // 防止浏览器默认事件

                    _handler.methods.triggerEvent('mousedown', e, true)
                },
                mousemove(e) {
                    if (globalMsg.mouseLeftDown) _instance.showGuideline()
                    _instance.setCurrentPosition(e)
                    _handler.methods.triggerEvent('mousemove', e)
                },
                mouseup(e) {
                    _instance.hideGuideline()
                    globalMsg.mouseLeftDown = false // 鼠标左键
                    _handler.spec.lock = false
                    if (SVGUtil.isSvgElement(e)) globalMsg.targetId = e.target.id
                    _handler.methods.triggerEvent('mouseup', e)
                    // todo  需要通知其他 plugin 进行清理工作
                },
                mouseover(e) {
                    _handler.methods.triggerEvent('mouseover', e)
                },
                mouseout(e) {
                    _handler.methods.triggerEvent('mouseout', e)
                },
                mousewheel(e) {
                    _instance.setMouseWheelPosition(e)
                    _handler.methods.triggerEvent('mousewheel', e)
                }
            },
            methods: {
                triggerEvent(_eventName, e, isLock) {
                    if (_handler.spec.pluginNameOfCreateSVG) {
                        let pluginName = _handler.spec.pluginNameOfCreateSVG

                        if (_handler.plugins[pluginName] && _handler.plugins[pluginName].eventMethods.create[_eventName]) {
                            _handler.plugins[pluginName].eventMethods.create[_eventName](e)
                            return
                        }
                        console.warn(pluginName + " is undefined")
                    } else {
                        let pluginName = _handler.methods.getCalleePluginName(e)
                        if (isLock) {
                            _handler.spec.lock = true
                        }
                        if (_handler.plugins[pluginName] && _handler.plugins[pluginName].eventMethods.base[_eventName]) {
                            _handler.plugins[pluginName].eventMethods.base[_eventName](e)
                            return
                        }
                        console.warn(pluginName + " is undefined")
                    }
                },
                removeEvents(e) {
                    //event unbind all listeners for all events
                    e ? _instance.getRawGroup().off(e) : _instance.getRawGroup().off()
                    return this
                },
                bindEvent(eventName, eventFunc) {
                    _instance.getRawGroup().on(eventName, eventFunc)
                    return this
                },
                rebindEvent(eventName, eventFunc) {
                    return this.removeEvents(eventName, eventFunc).bindEvent(eventName, eventFunc)
                },
                bindCoreEvent(eventName) {
                    if (_handler.coreEvents[eventName] === undefined) return this
                    return this.bindEvent(eventName, _handler.coreEvents[eventName])
                },
                rebindCoreEvent(eventName) {
                    if (_handler.coreEvents[eventName] === undefined) return this
                    return this.rebindEvent(eventName, _handler.coreEvents[eventName])
                },
                initPlugins(_plugins) {
                    if (_plugins && _plugins.length > 0) {
                        _plugins.forEach(_plugin => this.addPlugins(_plugin))
                        return this
                    }
                    console.error("initPlugins error: plugins is empty")
                    return this
                },
                addPlugins(_plugin) {
                    if (_plugin) {
                        _plugin.init(_instance)
                        _handler.plugins[_plugin.name] = _plugin
                        return this
                    }
                    console.error("addPlugins error: plugin is undefined")
                    return this
                },
                getCalleePluginName(e) {
                    // 获取 调用组件的名称
                    if (_handler.spec.lock === false) {
                        let pluginName = _getPluginName(e)
                        if (pluginName !== undefined && pluginName !== 'unknown' && pluginName !== 'guideLine')
                            _handler.spec.pluginName = pluginName
                    }

                    return _handler.spec.pluginName

                    function _getPluginName(e) {
                        return e && e.target && e.target.dataset['plugin'] ?
                            e.target.dataset['plugin'] :
                            'unknown'
                    }
                },
                setCreatePluginName(_name, _always) {
                    // 优先级最高，指定创建的plugin名称，创建完成后置空
                    _handler.spec.pluginNameOfCreateSVG = _name
                    if (_always) {
                        _handler.spec.createLock = true
                    }
                },
                clearCreatePluginName() {
                    _handler.spec.createLock = false
                    _handler.spec.pluginNameOfCreateSVG = null
                }
            },
        }

        // 初始化
        _handler.init()
        _handler.methods.initPlugins(_plugins)

        // 全局事件
        document.onkeydown = function (e) {
            shortKeyIfTrue(e.code === 'Delete' && globalMsg.targetId, function () {
                SVGUtil.removeSVGById(globalMsg.targetId)
                SVGUtil.removeAllPoints()
            }, e);
        }

        function shortKeyIfTrue(isMatch, success, e) {
            if (isMatch) {
                success();
                e.stopPropagation();
                e.preventDefault();
            }
        }

        return _handler
    }

////////////////////// position
    // 点的位置x,y,相对于图片的坐标rx,ry
    function SvgPosition() {
        return {
            x: 0, // 当前点的x坐标值
            y: 0, // 当前点的y坐标值
            rx: 0, // 鼠标相对于defaultGroup的位置，比较重要
            ry: 0,
            needRefresh: false,
            init() {
                this.x = 0
                this.y = 0
                this.rx = 0
                this.ry = 0
                return this;
            },
            setPosition(e, _p) {
                let positionResult = this.calculatePosition(e, _p)
                this.x = positionResult.x
                this.y = positionResult.y
                this.rx = positionResult.rx
                this.ry = positionResult.ry
                return this;
            },
            calculatePosition(e, _p) { // 计算 鼠标点在svg中的相对位置 // 获取点在svg中的坐标位置
                return {
                    x: e.offsetX,
                    y: e.offsetY,
                    // 理论上相对 group的位置 (也就是说 当前鼠标位置 减去 当前图片所处的位置 / 缩放比例就是当前相对位置)
                    // 当前节点的在drawing div 的 x坐标 - img 在div中的x坐标 / 缩放的比例 = 当前节点在svg image中 x的坐标
                    rx: (e.offsetX - _p.x) / _p.scale,
                    ry: (e.offsetY - _p.y) / _p.scale
                }
            },
            setRefresh(flag) {
                this.needRefresh = flag
            },
            isNeedRefresh() {
                return this.needRefresh
            },
            isInit() {
                return this.x === 0 && this.y === 0 && this.rx === 0 && this.ry === 0
            }
        }
    }

////////////////////// Guideline
    // 辅助线，在画框的时候添加
    function SvgGuideline(_params) {
        return {
            x: null,
            y: null,
            width: 1,
            color: _params.guidelineColor || '#0099CC',
            init(_group) {
                this.x = this.drawLine(_group, '_guideline-x')
                this.y = this.drawLine(_group, '_guideline-y')
                _group.add(this.x)
                _group.add(this.y)
            },
            updateParam(_p) {
                this.color = _p.guidelineColor || this.color
            },
            drawLine(_group, _id) {
                return _group.line(0, 0, 0, 0).stroke({
                    width: this.width,
                    color: this.color,
                    dasharray: '5,5',
                }).id(_id).data('plugin', 'guideLine')
            },
            show(curPosition, group) { // svg image 实际对象
                // 使用front将线显示在最前面，使用plot更新线的位置和长度
                let height = group.height()
                let width = group.width()

                this.x.front().plot(0, curPosition.ry + 1, width, curPosition.ry + 1)
                this.y.front().plot(curPosition.rx + 1, 0, curPosition.rx + 1, height)
            },
            hide() {
                this.x.plot(0, 0, 0, 0)
                this.y.plot(0, 0, 0, 0)
            }
        }
    }

////////////////////// Assert
    let Assert = {
        isTrue(condition, msg) {
            if (condition === false) throw new Error('svg error -- ' + msg)
        }
    }

////////////////////// SVGUtil
    let SVGUtil = {
        mouseStyle(_id, _style) {
            document.getElementById(_id).style.cursor = _style;
        },
        isSvgElement(e) {
            return e.target.dataset['tag'] === '_svg'
        },
        isSvgElementById(_id) {
            return document.getElementById(_id).dataset['tag'] === '_svg'
        },
        isSvgPoint(e) {
            return e.target.dataset['tag'] === '_point'
        },
        getSVGById(_id) {
            return SVG('#' + _id)
        },
        removeSVGById(_id) {
            let svg = SVG('#' + _id)
            if (svg) svg.remove()
        },
        removeAllPoints() {
            let points = SVG.find('._point')
            if (points && points.length > 0) points.forEach(_point => {
                _point.off()
                _point.remove()
            })
        }
    }

    global.Assert = Assert
    global.SVGTool = SVGTool
    global.globalMsg = globalMsg
})
(typeof window !== "undefined" ? window : this);