export function swipe(node, { onSwipeLeft, onSwipeRight, threshold = 60 }) {
  let startX = 0
  let startY = 0
  let currentX = 0
  let isDragging = false
  let direction = null
  
  function handleStart(x, y) {
    startX = x
    startY = y
    currentX = 0
    isDragging = true
    direction = null
    node.style.transition = 'none'
  }
  
  function handleMove(x, y, event) {
    if (!isDragging) return
    
    const deltaX = x - startX
    const deltaY = y - startY
    
    if (direction === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
    
    if (direction !== 'horizontal') return
    
    // Блокируем только горизонтальное движение
    event.preventDefault()
    
    currentX = deltaX
    const clampedX = applyResistance(currentX, node.clientWidth)
    node.style.transform = `translateX(${clampedX}px)`
  }
  
  function handleEnd() {
    if (!isDragging) return
    isDragging = false
    direction = null
    
    node.style.transition = 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    
    if (Math.abs(currentX) > threshold) {
      const endX = currentX > 0 ? node.clientWidth : -node.clientWidth
      node.style.transform = `translateX(${endX}px)`
      
      setTimeout(() => {
        node.style.transition = 'none'
        node.style.transform = 'translateX(0)'
        
        if (currentX > 0 && onSwipeRight) onSwipeRight()
        else if (currentX < 0 && onSwipeLeft) onSwipeLeft()
      }, 300)
    } else {
      node.style.transform = 'translateX(0)'
    }
    
    currentX = 0
  }
  
  // Используем Pointer Events — они работают для всего: touch, mouse, pen
  function handlePointerDown(e) {
    // Игнорируем нажатия на кнопки и интерактивные элементы
    if (e.target.closest('button, a, input, textarea')) return
    
    node.setPointerCapture(e.pointerId)
    handleStart(e.clientX, e.clientY)
  }
  
  function handlePointerMove(e) {
    handleMove(e.clientX, e.clientY, e)
  }
  
  function handlePointerUp() {
    handleEnd()
  }
  
  function handlePointerCancel() {
    handleEnd()
  }
  
  node.addEventListener('pointerdown', handlePointerDown)
  node.addEventListener('pointermove', handlePointerMove)
  node.addEventListener('pointerup', handlePointerUp)
  node.addEventListener('pointercancel', handlePointerCancel)
  
  // Запрещаем горизонтальный скролл страницы на touch-устройствах
  node.style.touchAction = 'pan-y'
  
  return {
    update(params) {
      onSwipeLeft = params.onSwipeLeft
      onSwipeRight = params.onSwipeRight
      threshold = params.threshold || 60
    },
    destroy() {
      node.removeEventListener('pointerdown', handlePointerDown)
      node.removeEventListener('pointermove', handlePointerMove)
      node.removeEventListener('pointerup', handlePointerUp)
      node.removeEventListener('pointercancel', handlePointerCancel)
    }
  }
}

function applyResistance(delta, width) {
  const maxOvershoot = width * 0.2
  const resistance = 0.3
  
  if (Math.abs(delta) > maxOvershoot) {
    const sign = Math.sign(delta)
    const overshoot = Math.abs(delta) - maxOvershoot
    return sign * (maxOvershoot + overshoot * resistance)
  }
  return delta
}