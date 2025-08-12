// 从JSON文件加载测试案例数据
let testCases = [];

// 使用fetch加载JSON数据
fetch('./js/cases.json')
  .then(response => response.json())
  .then(data => {
    testCases = data;
    // 加载完成后初始化卡片
    initializeCards();
  })
  .catch(error => {
    console.error('加载测试案例数据失败:', error);
  });


// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 页面加载时的初始化工作
  // 如果已经有数据，则初始化卡片
  if (testCases.length > 0) {
    initializeCards();
  }
  // 否则等待fetch完成后再初始化
});

// 初始化卡片函数
function initializeCards() {
  const cardContainer = document.getElementById('card-container');

  // 清空容器
  cardContainer.innerHTML = '';

  // 生成所有卡片
  testCases.forEach(testCase => {
    const card = createCard(testCase);
    cardContainer.appendChild(card);
  });
}

// 创建卡片元素
function createCard(testCase) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('data-id', testCase.id);

  // 创建卡片预览区域
  const cardPreview = document.createElement('div');
  cardPreview.className = 'card-preview';

  // 创建iframe预览
  const iframe = document.createElement('iframe');
  iframe.src = testCase.scenePath;
  iframe.title = testCase.title;
  cardPreview.appendChild(iframe);

  // 创建预览图片（用于备用）
  const img = document.createElement('img');
  img.src = testCase.thumbnailUrl;
  img.alt = testCase.title;
  img.style.display = 'none'; // 默认隐藏图片
  img.onerror = () => {
    img.src = './assets/thumbnails/placeholder.jpg';
  };
  cardPreview.appendChild(img);

  // 创建卡片内容区域
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';

  // 添加标题
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = testCase.title;
  cardContent.appendChild(title);

  // 添加描述
  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = testCase.description;
  cardContent.appendChild(description);

  // 添加标签
  const tagsContainer = document.createElement('div');
  testCase.tags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'card-tag';
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });
  cardContent.appendChild(tagsContainer);

  // 组装卡片
  card.appendChild(cardPreview);
  card.appendChild(cardContent);

  // 添加点击事件
  card.addEventListener('click', () => {
    let currentPath = window.location.href;
    if (window.webview && window.webview.raiseEvent) {
      if (testCase.scenePath.startsWith('http')) {
        window.webview.raiseEvent("requestSpatialPresentation", testCase.scenePath);
        // window.open(testCase.scenePath, '_blank');
      } else {
        const originPath = window.location.origin;
        const url = originPath + testCase.scenePath;
        console.log('url', url);
        window.webview.raiseEvent("requestSpatialPresentation", url);
      }
    } else {
      window.open(testCase.scenePath, '_blank');
    }
    console.log('raiseEvent', testCase.scenePath);
  });

  // 添加鼠标悬停和离开事件（可选，用于处理特殊交互）
  card.addEventListener('mouseenter', () => {
    // 鼠标悬停时的额外效果（如果需要）
  });

  card.addEventListener('mouseleave', () => {
    // 鼠标离开时的额外效果（如果需要）
  });

  return card;
}