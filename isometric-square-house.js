(() => {
  const ASSET_URL = 'data:image/webp;base64,UklGRj4QAABXRUJQVlA4WAoAAAAQAAAAfwAAfwAAQUxQSGcFAAAB8EZbmyFp27Zt+x6Z3adt27Zt27Zt27aty7Zt29d12mpWRcS+XWhV5J6Xf0TEBOD/xoYgLQcgtJlg270rILRWkF3Jn+wFSGvh/TZKfnMHiLSS6Dxv0nIm7xVtI+nDEolGxvzKtBDPZGokAEt/JhvJzD9O51kQBJ2cVMBsZ79D4xgvTe+XKjADEHRiWgHTn/QXMvEfEz8Ohc+qwNafe+GhFYGg46kCc5/ySzIZx8z2/ZkgPgFrfZwkO7cvDcgYUgGLnfMsmYzjZ35pxkocEtnwI4k5WSKHblsEAmgA1vvoABkzJ9zl4aj9CViXZCJJS+Szs4soMOuhA2Q0TtLiW5uicmiH3DGOndPAfFpj2ZufI5Nx8sa3VkHwZ0tmjmscmRNY+V0yGac086WVoM6ITv8U0ziJ12KFW15n1zjViS8tFNQXVDiTcQKbHRxJYw+7vAJ93sgZEyCfNUZjT2P3MFTOYC+mCZDGHpvxQNTOnMc4gWzsec5xBwRfrp5QkWadA6CunFoaM/Oiqn4EPMJUGBOvQ+3JvYylMfFo1I7c1wBLcUtUTohM81vm4mg2sArUhwC8QCuPmS8tF9QDAU4dzWxi5NPoc0CrRT/Phlp6e31UjZMKT7LTEBrf3BxVwwJw5mjXmsLMzg4IjVLM/V42Olv3QIQGVdj+WaZG0ciVEJoiFeZ+i5ENT/xYhdAMFaz/GyY2PvMzMyE0QVBf2mGmg4k/XBJaXtCVvk1muhj5ylYaSgvA19kxOtnlH4BQVoVpnrRIP1N6oEZVFFb6ATM9NX51cYRipO4/c4iJvka+tjdqKUNq3EbL9Dayuy5ES1DBQcMx099sIxdVkN4J6ptJo8dGfnNV0V6JLvd1JqPP1uVPIL0K+BA7dDvl2xB6JDLtpzrJL4sr9azCCXS8y86ckB4J5tn0nFezOUXeFQQlvp9dj4yvXLU9BL2Xvnrb39McSvw0oChSMMMjTP5Enhr6UWiN9Wj+ZK6PUIrITC/RvDHG5aGlQPFZJoeWK6jCnYwtd23rXfdfP9e0XMDdTC33CGO7yWNMDi1bUIXH/aHZWuUI+n/A7E7muhIKEZn5q8x0N/EElBKwNo0OZzsJoZT1s0uJnytnNaNP34CUUeEAS06JlnIKo0fGl2eBFnKsV+8uPBekBAlfYvaITB89dEYtQFC/4JXxd1tAe6dY9k0zn9jluVrExzhKpzPfPzOkgN0izZwaOlIVJW7+AGkepfiNZaQIBb7aIc0fdvZSRZGhb/rzBwaZsjPDfzpzekgZAKbf8IUBMnlifOmQ/hrFCupVD/vAz5kciflzuywm5UAA4ODP0LIXmR9bbAaUBCgU21wTSZoHOf1saUBQumKBvR4fTrTmmY3eUgdB+QosfgsHmRuXRn6/R1A0UQI2evK6X7LhOXNoMwgaKphhwfN/N2TWHEvkF3aaVtFYxTTzrvAEmXMzzMhnH5oDjRZApzv4FdKaYOTobbNDQ6MAAbDcCb+hWTlG0pgTB55bq4Ki+SLAoqf+mUWamZHMmUZ+ZM05AIGLGqR/q69Hy737xxSNJL95xIKACrwU9G98T2KPU4qjoyMvn77N/qcdssGh8wAQOCrQ2Y/7RUo2dZbJP160/uLzVIoxg8BXkb5Z7iBpU2Mpkvceu+EMACAiQUXgr2DRe77TpU0JyaEPrwZAVeC4QJa8/E/s5slY4uAD1+2nfSEInBfUOO0RMk+C5ImLoCUFFeY76bdMZmNYTkydh9eHVCqtAECB+T9BMqecM0letrhCBS0qAXOe8svEf3z12VvX7IcEtKwCc2305W/8+tnfrzYPAEULBwDzLjjvbIAGQSuL4h9V0N4iooL/9woAVlA4ILAKAADQKgCdASqAAIAAPp0+lkiloyIhMHwcYLATiWIGKAEO6Onof3jnF5hHVV+vSHt1OeY89LfX95B/umCO9gf99/Gz9o/VHyJfv9biRZIB31j0xwRaT6oisCa75HtQn9et+N/U9VExrnqjgrClGP72NsT/xJa8cU86OmzeDs1P3e2hzXu6mXaqfQoEuZ4SQ2palg7vRd3t+YEfMYN8W40qNlstzXEkikxwzStxOnSWYEPAMED+dk6W73MSTtXAnrC4p6lpPvwiUUAiDDB+jNiVb1R7+l4jGwqcEVlIn+01ZDIfvROHwpZtCpKLyXsx7PScQEOsdJ6iNRirc0kKIneDsFD77v7vSgHM0o3PKrSEAMUEBxz9t+C3WTaPGbnEYJfpnTaAVnkU6WhDeFi20rN8Q4HSe3pwPAHPMp7wApZ9CJFOE2X0q/BYoyBMv/XqqO/GakFAed7/NuVkv+B129cbOQAA/vytEKzRwC9X5kQVKCrVs1LB+lF1aVrUVPf/IH8UaCmNqXIgXjZe8777OT26gG9rz6CYslrCTGqE9mtAaab9snt16jYT3KIcu6YwRR7r4EZaDqg/xAlo1k/pR//PyGt8GUI1qBEr/ljer0ULI2oU4llvIIsQjk7oqlQKeq988dLe21tYPt9acBJ5taHYxcVz5lxjm0gDlMERKat82LnMazPrUIy5ocprSd1wm9uYgNCoETyIjZkZczqIWgI7ZBdI2S2oHjWinDaBJfk/O3pxt62/OdYZszJV24KVgeKH7ot4DKVFJhgdNf4+jnLe72VJ6TLfN/FzCjlhmndMmechBCmy7+u1sXzes0OJk94Jo+VPzZO4GXdLdNBi5z39YPCQgt4P8hiHYmMDrhjm2IEO1Su8SL6mhFlbg3Pj63B4+h03QQtUErf8jH8izJmwnsIpk4YsZpNYZj7XryOEr+I8vbvWkeWhUZ3MNKd/cR2MCVeGkih0mbJXYqvXXIdMEvAAaPRunS6EVBtl06UZe9IsPYiVVDQvH0gUyFphs6/JdpdZOfQXQED6runz/LzGq9ef/N6rY9VICJUOfn8J+PUCR9MTMlPJR2+48AnC1IuCkHzhaz74rOTtpFSfWq45ZpiQf8vTTNYq8hYnJpSMWNITLlc8zLKhb2tn1kc+XWcAz/TfGLFgbTinUqvXOnoHVykrStpnliYyjJ9EI9senlRnJzyfnnQ8hhpuUnT4wQMw4DX/q4yg1N58DWdqhkShf7yHR6X1G6P4vlig0jW8Nka4DotChHjJ5szde+QlTy25A2DbC7fcCelcWtbWphj7vOjDQEV7ogxoWx6TyR3x1GDY6LQZAUcEVQt2UfGo5krVYEY81kesNPfAKEh50gAkGfri56PBTIon2DOhbK7snbW7WijxJYWaWsrbn+hXk7zzVYiBj+5MCwhAqjxOeQRcmW+QbAnfapRW4ncJayynzNOGvHP8o36A/0StRLMKik304qF5sYK+XyeEBjXT7orE7ritN0/27f9O3ja4ar0YwKUd41HrSaPmH5mWvRsz+L4G4H+CL4VWroBkcmgsorum1/CzN6MC9DkoEuK61JTTMBpzwrWkClX5SVJDQTDyLv1Bx3Ik8P3zV0x8OfJx/vg5x6irhJNUfNFOQa8JAJedqmHErunbYmKZFh5fE2cTSliluflQmcucjRCLU7KukqRRacTdbez9KT5TdmfKBoyFnAHfn94z0lFt35eRU9cuwQyaZMPKitaF2YMeN6JX+EHjQUFEQw8a+5QPzs5RfHOWrFFcCFhS2PTVbDVxVYM4PQQxUhJ+Un5K3F5MQqJgi03YiC7XGZPz3iReH3hBSV3E/Q+btIJ094UxqPDKS6k/ODJ0eqvWkrzz6yExUtHmGEoDrPSKyPM3GX/7yBPenz0Zp6/sHxGlmN6zapvD/j+jZW/28yko24ztlS/0qLff2+RQmV4UnE/LT1pjyzuIBxIJcEJGJRBfgLY7Xl9bjz/YxLDm2cF9k57IPglmkDNK3Ns/sGSoA5dNtBJTwx7DPitTAi3FhAiFkDOkpBVN/ivfI1thsFovSmgU/VB+2diDGN+8EO+8MZrICt3Dvx+lRhvuQcTW8A3HoSek8xl1QEGmRqJ6jXyA0FRFU+bz+bbydlJPlSvwLLQjvp7OFb/ub+HXapeXAJ3VpovfP5wqCqjnpyXRK9gqpNOMmh7+2I1AnsZIdGTVE8mgUwF2Gw9rjFb9XuGWhmXQzbqMxm51Bl8e61TspH3Qrj23BQ6jgJKMUvBGGs0dOnpPPSmQ1dDYoxI32Zt/JEv6GcZZHc44y3ObA/rbDmaduWrFG6Pd6i/Y8Stsg/Ls5LntUSLLqMDt2HpAnd4kp5R7Yls+JAtRKGo+PVMkb61D/AwZ4PPV8VDbboJU2ZHVmsFWHq+GfZ7CKAXrvSErPv3s8nqzWD8Vm46uRWFdFGrNpAIAYxB/snKkKsd0n1CcshoF2KOT5kOW1MPBfJgSY1C2h3/givJeR23mPkcEFQix+/95bcrw+ElCScla0apqP2mCDI3XLRGXhgCfYLHpSFI6pQ7eVvxu6Wf0jk4FOlzYVrWSK2DPH33yKg1kJMPNsZO5RYeFLyZncIcAx0OXyKTgbUbH/JIpkUqEOG7dBhJYfU8pjjNhPPe1+BKqHtOh9dtQLn7Djb3HvdAX3BrbvHg5FdfyAM1y4iPod57Da7KEIOPgPsJQ9z8NFeL2a8Wkuby7AhtDMtE70jzi633LC0IlBlH7llT0Pz4X2L2pBrCDlgiSU6J8TZ28fG9alXrj4aWZMP9CYrJT+jnjpB7ZMwuvXvrjw8RtRDJf2vhyfOHQB6W81u8AEAPTXRX2+ad8KnmurwRPVMpPbejguv4kS3CnV9LTouUlAW/v4Ir/gH7/3JbFjBTJaU0YF+J/X9Na1SfkOLPtfRo3bqgpZGSuHFhyIRqoVWImecl4EPeDj2G8z+nu1HxYNJQkmOz9nsFYyW3QeyC3fOsa4N1jk2771pshmXfZjZ0Ic0npd/Lgz+hm7Lgk0E6J/wBMTHQpq9igNdum2foqMdDGEwQ/2hJCuTJzkyHribZUNEQgF8G+zMkgB7ozM6EOYrGtbMRv1N8gz4NTjLz/HQFDPeGKRWb97OoujWxFQVw8PCOkFkUOTrp2iA7MndkNyqrmvIHzMAYnKO6uvAmO0/4/+/c+SXg4m9G43wxcCPHMFarxbg7PahtGJ90c4Es3iWR4aX2aQBQz2oSHj+6Bxae9pGnvT7MK8Brw9ORxnRByYpEi/d5VfsUFbJ6v0Hnql5EClNcV3SD7AJNL45aOwg551BlMbd1AyJSropeNQb5m44lPQexX6ovjpleLIdaciSVDOuglvuHCLeShWlLT7yTbPfGyUpsfeJrokReUIybtk21Ysf0kY1TU2NjGvaIgFzMyUNL/7TttWsG6KDgxaP/qV/VNpXz1SkyXv3P20uny9GmFEcjvlSQnBrsZ7+bcXc8b/4ON0tWUX/+w8NHLNiKiupC/wNSEtAEMihVCNPuZzDqp79hq6IJD05O0JaIc6pfPX0aG4Xn21E57If4NzUHM7bfOiB6c8nscChuxN9XgaNPYNzO7admP4tBBPdVG3sInVvxUajk9kP4pKQn1nKZX+6blDnbGmv3cMS4LWnz8OSAV0wAAAAA=';
  const MAX_ATTEMPTS = 80;
  const RETRY_DELAY_MS = 250;

  function loadAsset() {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to decode isometric house asset'));
      image.src = ASSET_URL;
    });
  }

  function isSquareHouse(feature) {
    const properties = feature.properties ?? {};
    if (properties.kind !== 'building_icon') return false;
    if (properties.roof_style) return properties.roof_style === 'square';
    return properties.building_icon === 'house-square';
  }

  async function replaceSquareHouseImages() {
    if (!map.getLayer('building-icons')) return false;

    const features = map.querySourceFeatures('world', {
      filter: ['==', ['get', 'kind'], 'building_icon'],
    }).filter(isSquareHouse);

    if (!features.length) return false;

    const asset = await loadAsset();
    let updated = 0;

    for (const feature of features) {
      const imageName = feature.properties?.building_icon;
      if (!imageName || !map.hasImage(imageName)) continue;

      const currentImage = map.getImage(imageName);
      if (!currentImage?.width || !currentImage?.height) continue;

      const canvas = document.createElement('canvas');
      canvas.width = currentImage.width;
      canvas.height = currentImage.height;
      const context = canvas.getContext('2d');
      if (!context) continue;

      context.clearRect(0, 0, canvas.width, canvas.height);
      const padding = Math.max(1, Math.round(Math.min(canvas.width, canvas.height) * 0.02));
      context.drawImage(
        asset,
        padding,
        padding,
        Math.max(1, canvas.width - padding * 2),
        Math.max(1, canvas.height - padding * 2)
      );

      map.updateImage(imageName, context.getImageData(0, 0, canvas.width, canvas.height));
      updated += 1;
    }

    if (updated > 0) {
      const description = document.querySelector('.legend > div');
      if (description) {
        description.textContent = 'Тест: квадратные дома используют реалистичный изометрический фэнтези-коттедж; остальные типы пока процедурные.';
      }
      return true;
    }

    return false;
  }

  let attempts = 0;
  const timer = window.setInterval(async () => {
    attempts += 1;
    try {
      if (await replaceSquareHouseImages()) {
        window.clearInterval(timer);
      } else if (attempts >= MAX_ATTEMPTS) {
        window.clearInterval(timer);
        console.warn('Isometric square-house replacement timed out');
      }
    } catch (error) {
      window.clearInterval(timer);
      console.error('Isometric square-house replacement failed:', error);
    }
  }, RETRY_DELAY_MS);
})();
