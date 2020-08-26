(function (global) {

    function SVGPolygonPlugin(_param) {
        let context = null
        let msg = {
            isMoving: false, // 用于控制 创建point 和 svg移动之间的协调，在创建点中的mousemove 中如果isMoving = true，则清除所有点
        }

        let _point = {
            spec: {
                pointSize: 8,
                selectPointId: null,
                getPointSize() {
                    return this.pointSize / context.group.getScale()
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
                        if (globalMsg.mouseLeftDown === false) return
                        if (msg.isMoving) context.removeAllPoints()
                    },
                    mouseup(e) {
                        if (context.isSvgElement(e)) {
                            if (_polygon.spec.isDrawing) {
                                // 用于解决按下左键拖拽时，会显示最后一个失真点
                                _point.methods.drawLostLastOne(e.target.id)
                            } else {
                                _point.methods.drawAll(e.target.id)
                            }
                        }
                    }
                },
                move: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown && context.isSvgPoint(e))
                            _point.spec.selectPointId = e.target.id
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        if (_point.spec.selectPointId) {
                            _point.methods.drag()
                            context.setLastPosition(e)
                        }
                    },
                    mouseup(e) {
                        _point.spec.selectPointId = null
                    },
                    mouseover(e) {
                        context.commonPointMouseStyle(e)
                    },
                    mouseout(e) {
                        context.commonPointMouseStyleDefault(e)
                    }
                }
            },
            methods: {
                getPoints(svgTargetId) {
                    let points = []
                    context.getSVGById(svgTargetId).array().forEach((_p, index) => {
                        points.push({name: '_polygon_point_' + index, x: _p[0], y: _p[1]})
                    })
                    return points
                },
                drawAll(svgTargetId) {
                    context.removeAllPoints()
                    let points = this.getPoints(svgTargetId)
                    if (points.length > 0) {
                        points.forEach(_p => _point.methods.drawPoint(_p, svgTargetId))
                    }
                },
                drawLostLastOne(svgTargetId) {
                    context.removeAllPoints()
                    let points = this.getPoints(svgTargetId)
                    if (points.length > 0) {
                        for (let i = 0; i < points.length - 1; i++) {
                            _point.methods.drawPoint(points[i], svgTargetId)
                        }
                    }
                },
                drawPoint(_p, svgTargetId) {
                    let pointOffset = _point.spec.getPointSize() / 2
                    context.addSvgPoint(context.getDraw().circle(_point.spec.getPointSize())
                            .move(_p.x - pointOffset, _p.y - pointOffset)
                            .fill('#fff').stroke({// 画边框
                                color: _polygon.spec.color,
                                width: _polygon.spec.getLineWidth(),
                                linecap: 'round',
                                linejoin: 'miter'
                            })
                            .id(_p.name)
                            .data('parent', svgTargetId),
                        _plugin.name)
                },
                drag() {
                    let circlePoint = context.getSVGById(_point.spec.selectPointId)  // circle 有圆心属性
                    if (!circlePoint) return;
                    let currPoints = context.getSVGById(circlePoint.data('parent')).array()
                    let currIndex = null
                    // 找到该点的位置
                    currPoints.forEach((v, index) => {
                        if (v[0] === circlePoint.cx() && v[1] === circlePoint.cy()) {
                            currIndex = index
                        }
                    })
                    if (currIndex === null) return
                    // 移动该点
                    _point.methods.movePoint(circlePoint)
                    // 将移动后的点重新赋值
                    currPoints[currIndex] = [circlePoint.cx(), circlePoint.cy()]
                    // 绘图
                    context.getSVGById(circlePoint.data('parent')).plot(currPoints)
                },
                movePoint(circlePoint) {
                    let curr = context.getCurrentPosition()
                    let last = context.getLastPosition()
                    circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                },
            }

        }

        let _polygon = {
            spec: {
                className: '_polygon',
                type: 'polygon',

                color: _param.color || '#29769c',
                opacity: _param.opacity || 0.1,
                lineWidth: _param.lineWidth || 1.5,

                moveId: null,
                drawId: null,
                isDrawing: false,
                getLineWidth() {
                    return this.lineWidth / context.group.getScale()
                }
            },
            updateParam(_p) {

            },
            actions: {
                draw: {
                    dblclick(e) {
                        context.hideGuideline()
                        context.createSVGFinish()
                        context.mouseStyle('default')
                        // 进行校正，有些点是重复的，去除重复点
                        _polygon.methods.removeRepetitionPoints()
                        _polygon.methods.reset()
                    },
                    mousedown(e) {
                        context.mouseStyle('crosshair')
                        _polygon.spec.isDrawing = true
                        _polygon.methods.draw()
                    },
                    mousemove(e) {
                        context.mouseStyle('crosshair')
                        if (_polygon.spec.isDrawing) {
                            context.showGuideline()
                            _polygon.methods.refresh()
                        }
                    }
                },
                move: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown && context.isSvgElement(e))
                            _polygon.spec.moveId = e.target.id
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        if (_polygon.spec.moveId) {
                            msg.isMoving = true
                            let last = context.getLastPosition()
                            let curr = context.getCurrentPosition()
                            context.getSVGById(_polygon.spec.moveId)
                                .dmove(curr.rx - last.rx, curr.ry - last.ry)
                            context.setLastPosition(e)
                            context.mouseStyle('move')
                        }
                    },
                    mouseup(e) {
                        msg.isMoving = false
                        _polygon.methods.reset()
                        context.mouseStyle('default')
                    },
                    mouseover(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _polygon.spec.getLineWidth() * 2})
                            context.mouseStyle('move')
                        }
                    },
                    mouseout(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _polygon.spec.getLineWidth()})
                            context.mouseStyle('default')
                        }
                    }
                }
            },
            methods: {
                reset() {
                    _polygon.spec.drawId = null
                    _polygon.spec.moveId = null
                    _polygon.spec.isDrawing = false
                },
                draw() {
                    _polygon.spec.drawId ? updateSVG() : createSVG()

                    function createSVG() {
                        _polygon.spec.drawId = _polygon.spec.type + context.getGenerateId()
                        let last = context.getLastPosition()

                        // 绘制初始框
                        context.addSvgElement(
                            context.getDraw().polygon()
                                .fill({color: _polygon.spec.color, opacity: _polygon.spec.opacity})
                                .id(_polygon.spec.drawId)
                                .addClass(_polygon.spec.className)
                                .data('type', _polygon.spec.type)
                                .stroke({
                                    color: _polygon.spec.color,
                                    width: _polygon.spec.getLineWidth(),
                                    linecap: 'round'
                                }), _plugin.name)
                        // 初始绘制时，需要2个点，第二个点用于更新最新的位置代替使用
                        context.getSVGById(_polygon.spec.drawId).plot([[last.rx, last.ry], [last.rx, last.ry]])
                    }

                    function updateSVG() {
                        let currentPoints = context.getSVGById(_polygon.spec.drawId).array()
                        let curr = context.getCurrentPosition()
                        currentPoints.push([curr.rx, curr.ry])
                        context.getSVGById(_polygon.spec.drawId).plot(currentPoints)
                    }
                },
                refresh() {
                    let currentPoints = context.getSVGById(_polygon.spec.drawId).array()
                    let curr = context.getCurrentPosition()
                    // 创建时，鼠标移动，最后一个点时刻刷新
                    currentPoints.splice(-1, 1, [curr.rx, curr.ry])
                    context.getSVGById(_polygon.spec.drawId).plot(currentPoints)
                },
                removeRepetitionPoints() {
                    // 过滤重复点
                    let currentPoints = {}
                    context.getSVGById(_polygon.spec.drawId).array().forEach((_p, index) => {
                        currentPoints[_p[0].toFixed(3) + "-" + _p[1].toFixed(3)] = {
                            index: index,
                            value: [_p[0], _p[1]]
                        }
                    })
                    let rePoints = []
                    for (let key in currentPoints) {
                        rePoints.push(currentPoints[key])
                    }
                    context.getSVGById(_polygon.spec.drawId).plot(
                        rePoints.sort((a, b) => a.index - b.index).map(v => v.value))
                }
            }
        }

        let _plugin = {
            name: 'SVGPolygonPlugin',
            spec: {},
            init(_instance) {
                context = _instance
            },
            updateParam(_p) {

            },
            eventMethods: {
                create: {
                    dblclick(e) {
                        if (_polygon.actions.draw.dblclick) _polygon.actions.draw.dblclick(e)
                    },
                    mousedown(e) {
                        if (_polygon.actions.draw.mousedown) _polygon.actions.draw.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                    },
                    mousemove(e) {
                        if (_polygon.actions.draw.mousemove) _polygon.actions.draw.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                    },
                    mouseup(e) {
                        if (_polygon.actions.draw.mouseup) _polygon.actions.draw.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                    },
                    mouseover(e) {
                        if (_polygon.actions.draw.mouseover) _polygon.actions.draw.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                    },
                    mouseout(e) {
                        if (_polygon.actions.draw.mouseout) _polygon.actions.draw.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                    }
                },
                base: {
                    mousedown(e) {
                        if (_polygon.actions.move.mousedown) _polygon.actions.move.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                        if (_point.actions.move.mousedown) _point.actions.move.mousedown(e)
                    },
                    mousemove(e) {
                        if (_polygon.actions.move.mousemove) _polygon.actions.move.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                        if (_point.actions.move.mousemove) _point.actions.move.mousemove(e)
                    },
                    mouseup(e) {
                        if (_polygon.actions.move.mouseup) _polygon.actions.move.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                        if (_point.actions.move.mouseup) _point.actions.move.mouseup(e)
                    },
                    mouseover(e) {
                        if (_polygon.actions.move.mouseover) _polygon.actions.move.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                        if (_point.actions.move.mouseover) _point.actions.move.mouseover(e)
                    },
                    mouseout(e) {
                        if (_polygon.actions.move.mouseout) _polygon.actions.move.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                        if (_point.actions.move.mouseout) _point.actions.move.mouseout(e)
                    }
                }
            }
        }
        return _plugin
    }
    global.SVGPolygonPlugin = SVGPolygonPlugin
})(typeof window !== "undefined" ? window : this)