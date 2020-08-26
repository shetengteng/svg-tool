(function (global) {
    // 图片事件处理，拖拽，放大缩小
    function SVGImagePlugin(_param) {

        // context 是 SVG-TOOLs的 instance 上下文
        let context = null;

        let _image = {
            spec: {
                id: '_svgImage',
                uri: null,
                image: null,
                naturalHeight: null,
                naturalWidth: null,

                imageLoadPreCallBack: _param.imageLoadPreCallBack,
                imageLoadPostCallBack: _param.imageLoadPostCallBack,
                isDrag: false,
            },
            updateParam(_p) {
            },
            actions: {
                drag: {
                    mousedown(e) {
                        if (globalMsg.mouseLeftDown) {
                            _image.spec.isDrag = true
                            context.mouseStyle('move')
                        }
                    },
                    mousemove(e) {
                        if (globalMsg.mouseLeftDown === false) return
                        if (_image.spec.isDrag) {
                            _image.methods.moving()
                            context.setLastPosition(e)
                        }
                    },
                    mouseleave(e) {
                        this.mouseup(e)
                    },
                    mouseup(e) {
                        _image.spec.isDrag = false
                        context.mouseStyle('default')
                    },
                },
                zooming: {
                    mousewheel(e) { // 放大缩小
                        _image.methods.zooming(e)
                    }
                }
            },
            methods: {
                loadImage(imageUri) {
                    Assert.isTrue(imageUri, 'image uri must not be null')
                    _image.spec.uri = imageUri

                    if (typeof _image.spec.imageLoadPreCallBack === 'function') _image.spec.imageLoadPreCallBack()

                    context.getDraw().image(imageUri, function (e) {
                        // 获取原始高度用于计算缩放比例
                        _image.spec.naturalHeight = e.target.naturalHeight
                        _image.spec.naturalWidth = e.target.naturalWidth

                        context.getRawGroup()
                            .rect(e.target.naturalWidth, e.target.naturalHeight)
                            .fill('none')
                            .stroke({
                                color: '#666666',
                                width: 5,
                                linecap: 'round',
                                linejoin: 'round'
                            }).id("_imageBorder")
                        // 将图片纳入group管理，并渲染
                        context.addSvgInGroup(this).render(initZoom())

                        if (typeof _image.spec.imageLoadPostCallBack === 'function') _image.spec.imageLoadPostCallBack()
                    }).id(_image.spec.id).data('plugin', _plugin.name)

                    function initZoom() {
                        // 对图片进行初始缩放，image最长的边和外框最短的边重合进行缩放
                        // 显示时添加上下左右间距 px
                        let imageOffsetWithDiv = 100
                        let re = {x: null, y: null, scale: 1}
                        let imageWidth = _image.spec.naturalWidth
                        let imageHeight = _image.spec.naturalHeight
                        // 获得外框div
                        let drawWidth = document.getElementById(context.elementId).offsetWidth             // 放置svg的drawing div的宽度
                        let drawHeight = document.getElementById(context.elementId).offsetHeight           // 放置svg的drawing div的高度

                        // 说明image的大小超过了外框div，那么zoom的比例肯定是小于1的
                        if (imageWidth > drawWidth || imageHeight > drawHeight) {
                            if (imageWidth > drawWidth) imageWidth += imageOffsetWithDiv
                            if (imageHeight > drawHeight) imageHeight += imageOffsetWithDiv
                            re.scale = Math.min(drawWidth / imageWidth, drawHeight / imageHeight)
                        }

                        // 图片的相对位置 image svg 相对于外框div的x值
                        re.x = Math.abs(drawWidth - imageWidth * re.scale) / 2
                        re.y = Math.abs(drawHeight - imageHeight * re.scale) / 2

                        if (imageWidth > drawWidth) re.x += imageOffsetWithDiv * re.scale / 2
                        if (imageHeight > drawHeight) re.y += imageOffsetWithDiv * re.scale / 2

                        return re
                    }
                },
                zooming(e) {
                    // 计算该点的x y rx ry 的值
                    context.group.addScale(e.wheelDelta / 4800).setXY(
                        // 注意：此处的计算逻辑是先设置scale，然后使用新的scale参与计算
                        e.offsetX - context.position.mouseWheel.rx * context.group.getScale(),
                        e.offsetY - context.position.mouseWheel.ry * context.group.getScale()
                    ).render()
                },
                moving() {
                    let last = context.position.last
                    let curr = context.position.current
                    context.group.setXY(
                        context.group.x + curr.x - last.x,
                        context.group.y + curr.y - last.y
                    ).render()
                }
            },
        }

        let _plugin = {
            name: 'SVGImagePlugin',
            init(_instance) {
                context = _instance
            },
            loadImage(imageUri) {
                _image.methods.loadImage(imageUri)
            },
            unloadImage() {
                // todo
            },
            updateParam(_p) {
                _image.updateParam(_p)
            },
            eventMethods: {
                create: {
                    mousedown(e) {
                        if (_image.actions.drag.mousedown) _image.actions.drag.mousedown(e)
                    },
                    mousemove(e) {
                        if (_image.actions.drag.mousemove) _image.actions.drag.mousemove(e)
                    },
                    mouseup(e) {
                        if (_image.actions.drag.mouseup) _image.actions.drag.mouseup(e)
                        context.createSVGFinish()
                    },
                    mouseleave(e) {
                        if (_image.actions.drag.mouseleave) _image.actions.drag.mouseleave(e)
                    },
                    mouseover(e) {
                        if (_image.actions.drag.mouseover) _image.actions.drag.mouseover(e)
                    },
                    mousewheel(e) {
                        if (_image.actions.zooming.mousewheel) _image.actions.zooming.mousewheel(e)
                    }
                },
                base: {
                    mousedown(e) {
                        if (_image.actions.drag.mousedown) _image.actions.drag.mousedown(e)
                    },
                    mousemove(e) {
                        if (_image.actions.drag.mousemove) _image.actions.drag.mousemove(e)
                    },
                    mouseup(e) {
                        if (_image.actions.drag.mouseup) _image.actions.drag.mouseup(e)
                    },
                    mouseleave(e) {
                        if (_image.actions.drag.mouseleave) _image.actions.drag.mouseleave(e)
                    },
                    mouseover(e) {
                        if (_image.actions.drag.mouseover) _image.actions.drag.mouseover(e)
                    },
                    mousewheel(e) {
                        if (_image.actions.zooming.mousewheel) _image.actions.zooming.mousewheel(e)
                    }
                }
            }
        }
        return _plugin
    }

    global.SVGImagePlugin = SVGImagePlugin
})(typeof window !== "undefined" ? window : this);