(function (global) {
    function SVGRectPlugin(_param) {
        let context = null          // context 是 SVG-TOOLs的 instance 上下文
        let _point = {              // 所有rect公用这4个点
            spec: {
                pointSize: 8,
                selectPointId: null,
                getPointSize() {
                    return this.pointSize / context.group.getScale()
                },
                bestValue(_v) {
                    return _v < this.getPointSize() ? this.getPointSize() : _v
                }
            },
            coordinate: {
                leftTop: {
                    x: null,
                    y: null,
                    name: 'leftTop',
                    diagonal: 'rightBottom',
                    mouseStyle: 'nw-resize',
                    setXY(_rect) {
                        this.x = _rect.x()
                        this.y = _rect.y()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: Math.min(circlePoint.cx(), diagonal.x - _point.spec.getPointSize()),
                            y: Math.min(circlePoint.cy(), diagonal.y - _point.spec.getPointSize())
                        }
                    }
                },
                leftBottom: {
                    x: null,
                    y: null,
                    name: 'leftBottom',
                    diagonal: 'rightTop',
                    mouseStyle: 'ne-resize',
                    setXY(_rect) {
                        this.x = _rect.x()
                        this.y = _rect.y() + _rect.height()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: Math.min(circlePoint.cx(), diagonal.x - _point.spec.getPointSize()),
                            y: Math.min(circlePoint.cy() + _point.spec.getPointSize(), diagonal.y)
                        }
                    }
                },
                rightTop: {
                    x: null,
                    y: null,
                    name: 'rightTop',
                    diagonal: 'leftBottom',
                    mouseStyle: 'ne-resize',
                    setXY(_rect) {
                        this.x = _rect.x() + _rect.width()
                        this.y = _rect.y()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: Math.min(circlePoint.cx() + _point.spec.getPointSize(), diagonal.x),
                            y: Math.min(circlePoint.cy(), diagonal.y - _point.spec.getPointSize())
                        }
                    }
                },
                rightBottom: {
                    x: null,
                    y: null,
                    name: 'rightBottom',
                    diagonal: 'leftTop',
                    mouseStyle: 'nw-resize',
                    setXY(_rect) {
                        this.x = _rect.x() + _rect.width()
                        this.y = _rect.y() + _rect.height()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: Math.min(circlePoint.cx() + _point.spec.getPointSize(), diagonal.x),
                            y: Math.min(circlePoint.cy() + _point.spec.getPointSize(), diagonal.y)
                        }
                    }
                },
                topMiddle: { // 上面中间的点
                    x: null,
                    y: null,
                    name: 'topMiddle',
                    diagonal: 'bottomMiddle',
                    mouseStyle: 's-resize',
                    setXY(_rect) {
                        this.x = _rect.x() + _rect.width() / 2
                        this.y = _rect.y()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(0, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint, _rect) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _rect.width(), // 宽度不变
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: _rect.x(), // x 不变
                            y: Math.min(circlePoint.cy(), diagonal.y - _point.spec.getPointSize())
                        }
                    }
                },
                bottomMiddle: { // 底部中间的点
                    x: null,
                    y: null,
                    name: 'bottomMiddle',
                    diagonal: 'topMiddle',
                    mouseStyle: 's-resize',
                    setXY(_rect) {
                        this.x = _rect.x() + _rect.width() / 2
                        this.y = _rect.y() + _rect.height()
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint, _rect) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _rect.width(),
                            height: _point.spec.bestValue(Math.abs(circlePoint.cy() - diagonal.y)),
                            x: _rect.x(),
                            y: _rect.y()
                        }
                    }
                },
                leftMiddle: { // 左边中间的点
                    x: null,
                    y: null,
                    name: 'leftMiddle',
                    diagonal: 'rightMiddle',
                    mouseStyle: 'w-resize',
                    setXY(_rect) {
                        this.x = _rect.x()
                        this.y = _rect.y() + _rect.height() / 2
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint, _rect) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _rect.height(),
                            x: Math.min(circlePoint.cx(), diagonal.x - _point.spec.getPointSize()),
                            y: _rect.y()
                        }
                    }
                },
                rightMiddle: { // 右边中间点
                    x: null,
                    y: null,
                    name: 'rightMiddle',
                    diagonal: 'leftMiddle',
                    mouseStyle: 'w-resize',
                    setXY(_rect) {
                        this.x = _rect.x() + _rect.width()
                        this.y = _rect.y() + _rect.height() / 2
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        return this
                    },
                    getRectSpec(circlePoint, _rect) {
                        let diagonal = _point.coordinate[this.diagonal]
                        return {
                            width: _point.spec.bestValue(Math.abs(circlePoint.cx() - diagonal.x)),
                            height: _rect.height(),
                            x: _rect.x(),
                            y: _rect.y()
                        }
                    }
                }
            },
            actions: {
                draw: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown) {
                            if (context.isSvgElement(e)) {
                                _point.methods.drawAll(e.target.id)
                            } else if (context.isSvgPoint(e)) {
                                // do nothing
                            } else {
                                context.removeAllPoints()
                            }
                        }
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown) {
                            if (_rect.spec.isMoving) context.removeAllPoints()
                            else if (_rect.spec.isDrawing) {
                                _point.methods.drawLostLastOne(_rect.spec.drawId, e)
                            }
                        }
                    },
                    mouseup(e) {
                        if (context.isSvgElement(e)) {
                            _point.methods.drawAll(e.target.id)
                        }
                    }
                },
                move: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown && context.isSvgPoint(e))
                            _point.spec.selectPointId = e.target.id
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown) {
                            if (_point.spec.selectPointId) {
                                _point.methods.drag()
                                context.setLastPosition(e)
                            }
                        }
                    },
                    mouseup(e) {
                        _point.spec.selectPointId = null
                    },
                    mouseover(e) {
                        if (context.isSvgPoint(e)) context.mouseStyle(_point.coordinate[e.target.id].mouseStyle)
                    },
                    mouseout(e) {
                        context.commonPointMouseStyleDefault(e)
                    }
                }
            },
            methods: {
                getPoints(svgTargetId) {
                    let points = []
                    let rect = context.getSVGById(svgTargetId)
                    points.push({name: '_polygon_point_leftTop', x: rect.x(), y: rect.y()})
                    points.push({name: '_polygon_point_rightTop', x: rect.x() + rect.width(), y: rect.y()})
                    points.push({
                        name: '_polygon_point_rightBottom',
                        x: rect.x() + rect.width(),
                        y: rect.y() + rect.height()
                    })
                    points.push({name: '_polygon_point_leftBottom', x: rect.x(), y: rect.y() + rect.height()})
                    return points
                },
                drawLostLastOne(svgTargetId, e) { // 去除当前的点，防止在mouseup的时候找不到rect
                    context.removeAllPoints()
                    let points = this.getPoints(svgTargetId)
                    if (points.length > 0) {
                        let position = context.calculatePosition(e)
                        points.forEach(p => {
                            if (p.x === position.rx && p.y === position.ry) {
                            } else {
                                _point.methods.drawPoint(p, svgTargetId)
                            }
                        })
                    }
                },
                updateXY(_rect, _ignore) { // 更新所有的xy坐标值
                    let re = []
                    if (_rect) {
                        for (let key in _point.coordinate) {
                            re.push(key === _ignore ?
                                _point.coordinate[key] :
                                _point.coordinate[key].setXY(_rect))
                        }
                    }
                    return re;
                },
                drawPoint(_p, rectTargetId) {
                    let pointOffset = _point.spec.getPointSize() / 2
                    context.addSvgPoint(context.getDraw().circle(_point.spec.getPointSize())
                            .move(_p.x - pointOffset, _p.y - pointOffset)
                            .fill('#fff').stroke({// 画边框
                                color: _rect.spec.color,
                                width: _rect.spec.getLineWidth(),
                                linecap: 'round',
                                linejoin: 'miter'
                            })
                            .id(_p.name)
                            .data('parent', rectTargetId),
                        _plugin.name)
                },
                drawAll(rectTargetId) {
                    context.removeAllPoints()
                    _point.methods.updateXY(context.getSVGById(rectTargetId))
                        .forEach(_p => _point.methods.drawPoint(_p, rectTargetId))
                },
                drag() {
                    let circlePoint = context.getSVGById(_point.spec.selectPointId)  // circle 有圆心属性
                    if (!circlePoint) return;

                    let rect = context.getSVGById(circlePoint.data('parent'))
                    // 移动节点，返回rect的大小和位置点
                    let spec = _point.coordinate[_point.spec.selectPointId]
                        .movePoint(circlePoint, context.getCurrentPosition(), context.getLastPosition())
                        .getRectSpec(circlePoint, rect)

                    rect.size(spec.width, spec.height).move(spec.x, spec.y)   // 更改父svg rect元素大小和位置

                    // 更新其他点的数据，重新绘制
                    let diagonalName = _point.coordinate[_point.spec.selectPointId].diagonal
                    _point.methods.updateXY(rect, diagonalName).forEach(_p => {
                        if (_p.name === circlePoint.name || _p.name === diagonalName) {
                            // do nothing
                        } else {
                            context.removePoint(_p.name)
                            _point.methods.drawPoint(_p, circlePoint.data('parent'))
                        }
                    })
                }
            }
        }

        let _rect = {
            spec: {
                className: '_rect',
                type: 'rect',

                color: _param.color || '#29769c',
                opacity: _param.opacity || 0.1,
                lineWidth: _param.lineWidth || 1.5,

                moveId: null, // 移动的时候使用
                drawId: null, // 创建的时候使用
                isDrawing: false,
                isMoving: false,
                getLineWidth() {
                    return this.lineWidth / context.group.getScale()
                }
            },
            updateParam(_p) {
                _rect.spec.color = _p.color || _rect.spec.color
                _rect.spec.opacity = _p.opacity || _rect.spec.opacity
                _rect.spec.lineWidth = _param.lineWidth || _rect.spec.lineWidth
            },
            actions: {
                draw: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown) context.mouseStyle('default')
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        context.mouseStyle('default')
                        _rect.spec.isDrawing = true
                        _rect.methods.drawRect()
                    },
                    mouseup(e) {
                        _rect.methods.resetRect()
                        context.createSVGFinish()
                    },
                },
                move: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown && context.isSvgElement(e))
                            _rect.spec.moveId = e.target.id
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        if (_rect.spec.moveId) {
                            _rect.spec.isMoving = true
                            _rect.methods.moveRect()
                            context.setLastPosition(e)
                            context.mouseStyle('move')
                        }
                    },
                    mouseup(e) {
                        _rect.methods.resetRect()
                        context.mouseStyle('default')
                    },
                    mouseover(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _rect.spec.getLineWidth() * 2})
                            context.mouseStyle('move')
                        }
                    },
                    mouseout(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _rect.spec.getLineWidth()})
                            context.mouseStyle('default')
                        }
                    }
                }
            },
            methods: {
                resetRect() {
                    _rect.spec.moveId = null
                    _rect.spec.drawId = null
                    _rect.spec.isDrawing = false
                    _rect.spec.isMoving = false

                },
                moveRect(e) {
                    let last = context.getLastPosition()
                    let curr = context.getCurrentPosition()
                    context.getSVGById(_rect.spec.moveId).dmove(curr.rx - last.rx, curr.ry - last.ry)
                },
                drawRect() {
                    _rect.spec.drawId ? updateRect() : createRect()

                    function updateRect() {
                        // 更新 rect的坐标大小
                        let curr = context.getCurrentPosition()
                        let last = context.getLastPosition()
                        context.getSVGById(_rect.spec.drawId).size(
                            Math.abs(curr.rx - last.rx), // width
                            Math.abs(curr.ry - last.ry) // height
                        ).move(
                            Math.min(curr.rx, last.rx), // x
                            Math.min(curr.ry, last.ry) // y
                        )
                    }

                    function createRect() {
                        _rect.spec.drawId = _rect.spec.type + context.getGenerateId()
                        let last = context.getLastPosition()
                        return context.addSvgElement(
                            context.getDraw()
                                .rect(0, 0) // rect的初始大小是0
                                .move(last.rx, last.ry) // rect的初始位置是上一次点击的节点位置
                                .fill({color: _rect.spec.color, opacity: _rect.spec.opacity})
                                .id(_rect.spec.drawId)
                                .addClass(_rect.spec.className)
                                .data('type', _rect.spec.type)
                                .stroke({// 画边框
                                    color: _rect.spec.color,
                                    width: _rect.spec.getLineWidth(),
                                    linecap: 'round',
                                    linejoin: 'miter'
                                }), _plugin.name)
                    }
                }
            }
        }

        let _plugin = {
            name: 'SVGRectPlugin',
            spec: {},
            init(_instance) {
                context = _instance
            },
            updateParam(_p) {
                _rect.updateParam(_p)
                eventMsg.updateParam(_p)
            },
            eventMethods: {
                create: {
                    mousedown(e) {
                        if (_rect.actions.draw.mousedown) _rect.actions.draw.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                    },
                    mousemove(e) {
                        if (_rect.actions.draw.mousemove) _rect.actions.draw.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                    },
                    mouseup(e) {
                        if (_rect.actions.draw.mouseup) _rect.actions.draw.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                    },
                    mouseover(e) {
                        if (_rect.actions.draw.mouseover) _rect.actions.draw.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                    },
                    mouseout(e) {
                        if (_rect.actions.draw.mouseout) _rect.actions.draw.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                    }
                },
                base: {
                    mousedown(e) {
                        if (_rect.actions.move.mousedown) _rect.actions.move.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                        if (_point.actions.move.mousedown) _point.actions.move.mousedown(e)
                    },
                    mousemove(e) {
                        if (_rect.actions.move.mousemove) _rect.actions.move.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                        if (_point.actions.move.mousemove) _point.actions.move.mousemove(e)
                    },
                    mouseup(e) {
                        if (_rect.actions.move.mouseup) _rect.actions.move.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                        if (_point.actions.move.mouseup) _point.actions.move.mouseup(e)
                    },
                    mouseover(e) {
                        if (_rect.actions.move.mouseover) _rect.actions.move.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                        if (_point.actions.move.mouseover) _point.actions.move.mouseover(e)
                    },
                    mouseout(e) {
                        if (_rect.actions.move.mouseout) _rect.actions.move.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                        if (_point.actions.move.mouseout) _point.actions.move.mouseout(e)
                    }
                }
            }
        }
        return _plugin
    }

    global.SVGRectPlugin = SVGRectPlugin
})(typeof window !== "undefined" ? window : this)