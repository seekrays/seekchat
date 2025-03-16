import requests
from bs4 import BeautifulSoup

def get_weibo_hot():
    url = 'https://s.weibo.com/top/summary'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'}
    
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 解析热点数据（网站结构可能变化，需定期维护）
        hot_items = soup.select('.td-02 a')
        return [item.text for item in hot_items[:10]]
    
    except Exception as e:
        print(f'获取数据失败: {str(e)}')
        return []

# 使用示例
hot_list = get_weibo_hot()
print("当前微博热搜TOP10：")
for idx, item in enumerate(hot_list, 1):
    print(f"{idx}. {item}") 