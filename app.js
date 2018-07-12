var dataJson = require("./json")
var path = require("path")
var fs = require("fs")
var puppeteer = require('puppeteer')
var num = 0;  //计数器


/**
 *队列执行
 *
 */
function Queue() {

    //初始化队列（使用数组实现）
    var items = [];

    //向队列（尾部）中插入元素
    this.enqueue = function (element) {
        items.push(element);
    }

    //从队列（头部）中弹出一个元素，并返回该元素
    this.dequeue = function () {
        return items.shift();
    }

    //查看队列最前面的元素（数组中索引为0的元素）
    this.front = function () {
        return items[0];
    }

    //查看队列是否为空，如果为空，返回true；否则返回false
    this.isEmpty = function () {
        return items.length == 0;
    }

    //查看队列的长度
    this.size = function () {
        return items.length;
    }

    //查看队列
    this.print = function () {
        //以字符串形势返回
        return items.toString();
    }
}


/**
 *创建文件夹
 *
 * @param {*} dirname String
 * @param {*} callback Fun
 */
function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback ? callback(console.log(`${dirname}文件夹已存在!`)) : false;
        } else {
            console.log(path.dirname(dirname));
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname);
                // console.log('在' + path.dirname(dirname) + '目录创建好' + dirname  +'目录');
            });
        }
    });
}


/**
 * 2. 循环调用内容
 *
 * @param {*} id
 * @param {*} name
 * @param {*} len
 */
async function run(id, name, len) {
    // 3. 新建文件夹
    mkdirs(name)
    // 4. 访问页面抓取a标签
    var browser = await puppeteer.launch({
        headless: false,
        slowMo: 150,
        ignoreHTTPSErrors: true
    });
    var page = await browser.newPage();
    await page.goto(`https://www.jdcloud.com/help/detail/${id}/isCatalog/0`)

    var SfFeArticleList = await page.evaluate(() => {
        var list = [...document.querySelectorAll('.help-left .help-llst a')]
        return list.map(el => {
            return { href: el.href.trim(), title: el.innerText }
        })
    })
    await fs.writeFile(path.join(name, `${id}.json`), JSON.stringify(SfFeArticleList, null, 4), { flag: 'w', encoding: 'utf-8', mode: '0666' }, function (err) {
        num++;
        if (err) {
            console.log(err)
            console.log("json写入失败")
        } else {
            console.log(`json写入成功 总进度:${num}/${len}`);
        }
    })
    await browser.close();
}



/**
 * 1. 循环json文件 定义目录url 传入名称
 *
 * @param {*} dataJson
 * @param {*} num
 * @returns
 */
async function goQueue(dataJson, num) {

    var queue = new Queue();
    //把名单插入队列
    for (var i = 0; i < dataJson.length; i++) {
        queue.enqueue(dataJson[i]);
        await run(dataJson[i].id, dataJson[i].name, dataJson.length)
    }
    //执行current初始值
    var eliminated = '';
    //当队列里的人数大于1人时，继续传递
    while (queue.size() > 0) {
        for (var i = 0; i < num; i++) {
            //每次把队列头部弹出的队员再次插入队列的尾部，行程一个循环队列
            queue.enqueue(queue.dequeue());

        }
        //当循环停止时，即到了指定的传递次数时，弹出队列头部的队员
        eliminated = queue.dequeue();
        // console.log(`${eliminated.name} 执行完毕`);
    }
    return queue.dequeue();
}

goQueue(dataJson);
 
