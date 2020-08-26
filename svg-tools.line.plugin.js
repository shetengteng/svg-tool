(function (global) {
    function SVGLinePlugin(_param) {
        let context = null

        let _point = {
            spec: {
                pointSize: 8,
                selectPointId: null,
                getPointSize() {
                    return this.pointSize / context.group.getScale()
                },
                sublineId: null,
            },
            coordinate: {
                left: {
                    x: null,
                    y: null,
                    name: 'left',
                    diagonal: 'right',
                    setXY(_svgLine) {
                        if (_svgLine) {
                            this.x = _svgLine.array()[0][0]
                            this.y = _svgLine.array()[0][1]
                        }
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        this.x = circlePoint.cx()
                        this.y = circlePoint.cy()
                        return this
                    }
                },
                right: {
                    x: null,
                    y: null,
                    name: 'right',
                    diagonal: 'left',
                    setXY(_svgLine) {
                        if (_svgLine) {
                            this.x = _svgLine.array()[1][0]
                            this.y = _svgLine.array()[1][1]
                        }
                        return this
                    },
                    movePoint(circlePoint, curr, last) {
                        circlePoint.dmove(curr.rx - last.rx, curr.ry - last.ry)
                        this.x = circlePoint.cx()
                        this.y = circlePoint.cy()
                        return this
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
                        if (globalMsg.mouseLeftDown === false) return
                        if (_line.spec.isMoving) {
                            context.removeAllPoints()
                        } else if (context.isSvgElement(e) && _line.spec.isDrawing)
                            _point.methods.drawStart(e.target.id)

                    },
                    mouseup(e) {
                        if (context.isSvgElement(e)) {
                            if (e.target.id !== 'subline') _point.methods.drawAll(e.target.id)
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
                            _point.methods.drawSubline()
                            context.setLastPosition(e)
                        }
                    },
                    mouseup(e) {
                        if (_point.spec.selectPointId) {
                            context.removeSVGById(_point.spec.sublineId)
                            _point.methods.drag()
                            _point.spec.selectPointId = null
                            _point.spec.sublineId = null
                        }
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
                drawSubline() {
                    let circlePoint = context.getSVGById(_point.spec.selectPointId)  // circle 有圆心属性
                    if (!circlePoint) return;

                    _point.coordinate[_point.spec.selectPointId].movePoint(circlePoint, context.getCurrentPosition(), context.getLastPosition())

                    // 初始是null，创建后进行update
                    _point.spec.sublineId ? updateLine() : createLine()

                    function createLine() {
                        _point.spec.sublineId = 'subline'
                        context.addSvgElement(
                            context.getDraw()
                                .line(0, 0, 0, 0)
                                .id(_point.spec.sublineId)
                                .stroke({
                                    color: _line.spec.color,
                                    width: _line.spec.getLineWidth(),
                                    dasharray: '5,5',
                                }), _plugin.name)
                        updateLine()
                    }
                    function updateLine() {
                        context.getSVGById(_point.spec.sublineId).plot(
                            _point.coordinate.left.x, _point.coordinate.left.y,
                            _point.coordinate.right.x, _point.coordinate.right.y)
                    }
                },
                drawAll(_lineId) {
                    context.removeAllPoints()
                    _point.methods.updateXY(context.getSVGById(_lineId))
                        .forEach(_p => _point.methods.drawPoint(_p, _lineId))
                },
                // 初始的时候只绘制第一个点
                drawStart(svgTargetId) {
                    context.removeAllPoints()
                    let points = _point.methods.updateXY(context.getSVGById(svgTargetId))
                    if (points.length > 0) {
                        _point.methods.drawPoint(points[0], svgTargetId)
                    }
                },
                updateXY(_svgLine) {
                    let re = []
                    for (let key in _point.coordinate) {
                        re.push(_point.coordinate[key].setXY(_svgLine))
                    }
                    return re
                },
                drawPoint(_p, _lineId) {
                    let pointOffset = _point.spec.getPointSize() / 2
                    context.addSvgPoint(context.getDraw().circle(_point.spec.getPointSize())
                        .move(_p.x - pointOffset, _p.y - pointOffset)
                        .fill('#fff').stroke({ //
                            color: _line.spec.color,
                            width: _line.spec.getLineWidth(),
                            linecap: 'round',
                            linejoin: 'miter'
                        })
                        .id(_p.name)
                        .data('parent', _lineId), _plugin.name)
                },
                drag() {
                    let circlePoint = context.getSVGById(_point.spec.selectPointId)  // circle 有圆心属性
                    if (!circlePoint) return;

                    let parent = context.getSVGById(circlePoint.data('parent'))
                    if (!parent) return

                    _point.coordinate[_point.spec.selectPointId].movePoint(circlePoint, context.getCurrentPosition(), context.getLastPosition())
                    parent.plot(
                        _point.coordinate.left.x, _point.coordinate.left.y,
                        _point.coordinate.right.x, _point.coordinate.right.y
                    )
                }

            }
        }

        let _line = {
            spec: {
                className: '_line',
                type: 'line',

                color: _param.color || '#29769c',
                lineWidth: _param.lineWidth || 2,

                drawId: null, // 创建的时候使用
                moveId: null, // 移动的时候使用
                isMoving: false,
                isDrawing: false,
                getLineWidth() {
                    return this.lineWidth / context.group.getScale()
                }
            },
            updateParam(_p) {

            },
            actions: {
                draw: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown) context.mouseStyle('crosshair')
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        context.mouseStyle('crosshair')
                        _line.spec.isDrawing = true
                        _line.methods.drawLine()
                    },
                    mouseup(e) {
                        if (_line.spec.moveId) return
                        _line.methods.reset()
                        context.mouseStyle('default')
                        context.createSVGFinish()
                    }
                },
                move: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown && context.isSvgElement(e)) _line.spec.moveId = e.target.id
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        if (_line.spec.moveId) {
                            _line.spec.isMoving = true
                            _line.methods.moveLine()
                            context.setLastPosition(e)
                            context.mouseStyle('move')
                        }
                    },
                    mouseup(e) {
                        _line.methods.reset()
                        context.mouseStyle('default')
                    },
                    mouseover(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _line.spec.getLineWidth() * 2})
                            context.mouseStyle('move')
                        }
                    },
                    mouseout(e) {
                        if (context.isSvgElement(e)) {
                            context.getSVGById(e.target.id).stroke({width: _line.spec.getLineWidth()})
                            context.mouseStyle('default')
                        }
                    }
                },
            },
            methods: {
                reset() {
                    _line.spec.drawId = null
                    _line.spec.moveId = null
                    _line.spec.isMoving = false
                    _line.spec.isDrawing = false
                },
                drawLine() {
                    // 初始是null，创建后进行update
                    _line.spec.drawId ? updateLine() : createLine()

                    function createLine() {
                        _line.spec.drawId = _line.spec.type + context.getGenerateId()
                        let last = context.getLastPosition()
                        // 初始大小是一个点 在last位置
                        context.addSvgElement(
                            context.getDraw()
                                .line(0, 0, 0, 0)
                                .move(last.rx, last.ry)
                                .id(_line.spec.drawId)
                                .addClass(_line.spec.className)
                                .data('type', _line.spec.type)
                                .stroke({
                                    color: _line.spec.color,
                                    width: _line.spec.getLineWidth(),
                                    linecap: 'round'
                                }), _plugin.name)

                    }

                    function updateLine() {
                        let curr = context.getCurrentPosition()
                        let last = context.getLastPosition()
                        context.getSVGById(_line.spec.drawId).plot(
                            last.rx, last.ry,
                            curr.rx, curr.ry
                        ).move(
                            Math.min(curr.rx, last.rx), // x
                            Math.min(curr.ry, last.ry) // y
                        )
                    }
                },
                moveLine() {
                    let last = context.getLastPosition()
                    let curr = context.getCurrentPosition()
                    context.getSVGById(_line.spec.moveId).dmove(curr.rx - last.rx, curr.ry - last.ry)
                }
            }
        }

        let _plugin = {
            name: 'SVGLinePlugin',
            init(_instance) {
                context = _instance
            },
            updateParam(_p) {

            },
            eventMethods: {
                create: {
                    mousedown(e) {
                        if (_line.actions.draw.mousedown) _line.actions.draw.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                    },
                    mousemove(e) {
                        if (_line.actions.draw.mousemove) _line.actions.draw.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                    },
                    mouseup(e) {
                        if (_line.actions.draw.mouseup) _line.actions.draw.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                    },
                    mouseover(e) {
                        if (_line.actions.draw.mouseover) _line.actions.draw.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                    },
                    mouseout(e) {
                        if (_line.actions.draw.mouseout) _line.actions.draw.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                    }
                },
                base: {
                    mousedown(e) {
                        if (_line.actions.move.mousedown) _line.actions.move.mousedown(e)
                        if (_point.actions.move.mousedown) _point.actions.move.mousedown(e)
                        if (_point.actions.draw.mousedown) _point.actions.draw.mousedown(e)
                    },
                    mousemove(e) {
                        if (_line.actions.move.mousemove) _line.actions.move.mousemove(e)
                        if (_point.actions.move.mousemove) _point.actions.move.mousemove(e)
                        if (_point.actions.draw.mousemove) _point.actions.draw.mousemove(e)
                    },
                    mouseup(e) {
                        if (_line.actions.move.mouseup) _line.actions.move.mouseup(e)
                        if (_point.actions.move.mouseup) _point.actions.move.mouseup(e)
                        if (_point.actions.draw.mouseup) _point.actions.draw.mouseup(e)
                    },
                    mouseover(e) {
                        if (_line.actions.move.mouseover) _line.actions.move.mouseover(e)
                        if (_point.actions.move.mouseover) _point.actions.move.mouseover(e)
                        if (_point.actions.draw.mouseover) _point.actions.draw.mouseover(e)
                    },
                    mouseout(e) {
                        if (_line.actions.move.mouseout) _line.actions.move.mouseout(e)
                        if (_point.actions.move.mouseout) _point.actions.move.mouseout(e)
                        if (_point.actions.draw.mouseout) _point.actions.draw.mouseout(e)
                    }
                }
            }
        }
        return _plugin
    }

    global.SVGLinePlugin = SVGLinePlugin
})
(typeof window !== "undefined" ? window : this);