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
  
  function handleMove(x, y, preventDefault) {
    if (!isDragging) return
    
    const deltaX = x - startX
    const deltaY = y - startY
    
    if (direction === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
    
    if (direction !== 'horizontal') return
    
    if (preventDefault) preventDefault()
    
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
  
  // Touch events
  function handleTouchStart(e) {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }
  
  function handleTouchMove(e) {
    handleMove(e.touches[0].clientX, e.touches[0].clientY, () => e.preventDefault())
  }
  
  function handleTouchEnd() {
    handleEnd()
  }
  
  // Mouse events (для десктопа)
  function handleMouseDown(e) {
    handleStart(e.clientX, e.clientY)
  }
  
  function handleMouseMove(e) {
    handleMove(e.clientX, e.clientY)
  }
  
  function handleMouseUp() {
    handleEnd()
  }
  
  node.addEventListener('touchstart', handleTouchStart, { passive: true })
  node.addEventListener('touchmove', handleTouchMove, { passive: false })
  node.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  node.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  
  return {
    update(params) {
      onSwipeLeft = params.onSwipeLeft
      onSwipeRight = params.onSwipeRight
      threshold = params.threshold || 60
    },
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart)
      node.removeEventListener('touchmove', handleTouchMove)
      node.removeEventListener('touchend', handleTouchEnd)
      
      node.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
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