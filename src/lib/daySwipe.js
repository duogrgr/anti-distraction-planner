export function daySwipe(node, { onSwipeLeft, onSwipeRight, canSwipeRight = () => true, threshold = 80 }) {
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
    
    event.preventDefault()
    currentX = deltaX
    
    // Резиновый эффект при попытке уйти за границу
    let effectiveX = currentX
    if (currentX > 0 && !canSwipeRight()) {
      effectiveX = currentX * 0.3
    }
    
    node.style.transform = `translateX(${effectiveX}px)`
  }
  
  function handleEnd() {
    if (!isDragging) return
    isDragging = false
    direction = null
    
    node.style.transition = 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    
    const canGoBack = canSwipeRight()
    
    if (Math.abs(currentX) > threshold) {
      if (currentX > 0 && canGoBack) {
        // Свайп вправо = вчера
        node.style.transform = `translateX(${node.clientWidth}px)`
        setTimeout(() => {
          node.style.transition = 'none'
          node.style.transform = 'translateX(0)'
          onSwipeRight()
        }, 250)
      } else if (currentX < 0) {
        // Свайп влево = завтра
        node.style.transform = `translateX(${-node.clientWidth}px)`
        setTimeout(() => {
          node.style.transition = 'none'
          node.style.transform = 'translateX(0)'
          onSwipeLeft()
        }, 250)
      } else {
        // Запрещено (старше 7 дней) — возврат + вибрация
        node.style.transform = 'translateX(0)'
        if (navigator.vibrate) navigator.vibrate(30)
      }
    } else {
      // Недотянул — возврат
      node.style.transform = 'translateX(0)'
    }
    
    currentX = 0
  }
  
  function handlePointerDown(e) {
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
  
  node.addEventListener('pointerdown', handlePointerDown)
  node.addEventListener('pointermove', handlePointerMove)
  node.addEventListener('pointerup', handlePointerUp)
  node.addEventListener('pointercancel', handlePointerUp)
  node.style.touchAction = 'pan-y'
  
  return {
    update(params) {
      onSwipeLeft = params.onSwipeLeft
      onSwipeRight = params.onSwipeRight
      canSwipeRight = params.canSwipeRight || (() => true)
      threshold = params.threshold || 80
    },
    destroy() {
      node.removeEventListener('pointerdown', handlePointerDown)
      node.removeEventListener('pointermove', handlePointerMove)
      node.removeEventListener('pointerup', handlePointerUp)
      node.removeEventListener('pointercancel', handlePointerUp)
    }
  }
}