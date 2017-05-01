  function getMenuPosition(menu, x, y) {
    let
      menuStyles = {
        top: y,
        left: x
      }
      , bottom = document.documentElement.clientHeight
      , right = document.documentElement.clientWidth
      , height = menu.clientHeight
      , width = menu.clientWidth;

    if (menuStyles.top + height > bottom) {
      menuStyles.top -= height;
    }

    if (menuStyles.top < 0) {
      menuStyles.top = 0;
    }

    if (menuStyles.left + width > right) {
      menuStyles.left -= width;
    }

    if (menuStyles.left < 0) {
      menuStyles.left = 0;
    }

    return menuStyles;

  }

  export default getMenuPosition;