export function swipe(node, { onSwipeLeft, onSwipeRight, threshold = 60, canSwipe = () => true }) {
  let startX = 0
  let startY = 0
  let currentX = 0
  let isDragging = false
  let direction = null // 'horizontal' | 'vertical' | null
  
  function handleTouchStart(e) {
    if (!canSwipe()) return
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    currentX = 0
    isDragging = true
    direction = null
    node.style.transition = 'none'
  }
  
  function handleTouchMove(e) {
    if (!isDragging) return
    
    const deltaX = e.touches[0].clientX - startX
    const deltaY = e.touches[0].clientY - startY
    
    // Определяем направление один раз
    if (direction === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
    
    if (direction !== 'horizontal') return
    
    // Предотвращаем горизонтальный скролл страницы
    e.preventDefault()
    
    currentX = deltaX
    
    // "Резиновый эффект" — замедление при свайпе за границу
    const clampedX = applyResistance(currentX, node.clientWidth)
    
    node.style.transform = `translateX(${clampedX}px)`
  }
  
  function handleTouchEnd() {
    if (!isDragging) return
    isDragging = false
    direction = null
    
    node.style.transition = 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    
    if (Math.abs(currentX) > threshold) {
      // Свайп достаточный — анимируем до конца и переключаем
      const endX = currentX > 0 ? node.clientWidth : -node.clientWidth
      node.style.transform = `translateX(${endX}px)`
      
      setTimeout(() => {
        node.style.transition = 'none'
        node.style.transform = 'translateX(0)'
        
        if (currentX > 0 && onSwipeRight) onSwipeRight()
        else if (currentX < 0 && onSwipeLeft) onSwipeLeft()
      }, 300)
    } else {
      // Недотянул — возврат
      node.style.transform = 'translateX(0)'
    }
    
    currentX = 0
  }
  
  node.addEventListener('touchstart', handleTouchStart, { passive: true })
  node.addEventListener('touchmove', handleTouchMove, { passive: false })
  node.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  return {
    update(params) {
      onSwipeLeft = params.onSwipeLeft
      onSwipeRight = params.onSwipeRight
      threshold = params.threshold || 60
      canSwipe = params.canSwipe || (() => true)
    },
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart)
      node.removeEventListener('touchmove', handleTouchMove)
      node.removeEventListener('touchend', handleTouchEnd)
    }
  }
}

// "Резиновый" эффект при свайпе за границу
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