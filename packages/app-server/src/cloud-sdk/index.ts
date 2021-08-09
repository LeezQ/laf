import { AxiosStatic } from "axios"
import { Db } from "less-api-database"
import { FunctionContext, FunctionResult, CloudFunction } from "cloud-function-engine"
import { FileStorageInterface } from "../lib/storage/interface"
import * as mongodb from "mongodb"
import { Globals } from "../lib/globals/index"
import { LocalFileStorage } from "../lib/storage/local_file_storage"
import Config from "../config"
import request from 'axios'
import { SchedulerInstance } from "../lib/scheduler"
import { getToken, parseToken } from "../lib/utils/token"
import { invokeInFunction } from "./invoke"


export type InvokeFunctionType = (name: string, param: FunctionContext) => Promise<FunctionResult>
export type EmitFunctionType = (event: string, param: any) => void
export type GetTokenFunctionType = (payload: any, secret?: string) => string
export type ParseTokenFunctionType = (token: string, secret?: string) => any | null

export interface MongoDriverObject {
  client: mongodb.MongoClient
  db: mongodb.Db
}

export interface CloudSdkInterface {
  /**
   * 发送 HTTP 请求，实为 Axios 实例，使用可直接参考 axios 文档
   */
  fetch: AxiosStatic

  /**
   * 获取一个文件存储管理器
   * @param namespace  文件的名字空间，如 'public'
   */
  storage(namespace: string): FileStorageInterface

  /**
   * 获取 less api database ORM 实例
   */
  database(): Db,

  /**
   * 调用云函数
   */
  invoke: InvokeFunctionType

  /**
   * 抛出云函数事件，其它云函数可设置触发器监听此类事件
   */
  emit: EmitFunctionType

  /**
   * 云函数全局内存单例对象，可跨多次调用、不同云函数之间共享数据
   * 1. 可将一些全局配置初始化到 shared 中，如微信开发信息、短信发送配置
   * 2. 可共享一些常用方法，如 checkPermission 等，以提升云函数性能
   * 3. 可做热数据的缓存，建议少量使用（此对象是在 node vm 堆中分配，因为 node vm 堆内存限制）
   */
  shared: Map<string, any>

  /**
   * 获取 JWT Token，若缺省 `secret`，则使用当前服务器的密钥做签名
   */
  getToken: GetTokenFunctionType

  /**
   * 解析 JWT Token，若缺省 `secret`，则使用当前服务器的密钥做签名
   */
  parseToken: ParseTokenFunctionType

  /**
   * 当前应用的 MongoDb Node.js Driver 实例对象。
   * 由于 less-api-database ORM 对象只有部分数据操作能力，故暴露此对象给云函数，让云函数拥有完整的数据库操作能力：
   * 1. 事务操作
   * ```js
   *   const session = mongo.client.startSession()
   *   try {
   *     await session.withTransaction(async () => {
   *       await mongo.db.collection('xxx').updateOne({}, { session })
   *       await mongo.db.collection('yyy').deleteMany({}, { session })
   *       // ...
   *     })
   *   } finally {
   *     await session.endSession()
   *   }
   * ```
   * 2. 索引管理
   * ```js
   *    mongo.db.collection('admins').createIndex('username', { unique: true })
   * ```
   * 3. 聚合操作
   */
  mongo: MongoDriverObject
}


/**
 * Cloud SDK 实例
 */
const cloud: CloudSdkInterface = {
  database: () => Globals.createDb(),
  storage: (namespace: string) => new LocalFileStorage(Config.LOCAL_STORAGE_ROOT_PATH, namespace),
  fetch: request,
  invoke: invokeInFunction,
  emit: (event: string, param: any) => SchedulerInstance.emit(event, param),
  shared: CloudFunction._shared_preference,
  getToken: getToken,
  parseToken: parseToken,
  mongo: {
    client: Globals.accessor.conn,
    db: Globals.accessor.db
  }
}

/**
 * 等数据库连接成功后，更新其 mongo 对象，否则为 null
 */
Globals.accessor.ready.then(() => {
  cloud.mongo.client = Globals.accessor.conn
  cloud.mongo.db = Globals.accessor.db
})

/**
 * 创建一个 SDK 实例
 * @returns 
 */
export function create() {
  const cloud: CloudSdkInterface = {
    database: () => Globals.createDb(),
    storage: (namespace: string) => new LocalFileStorage(Config.LOCAL_STORAGE_ROOT_PATH, namespace),
    fetch: request,
    invoke: invokeInFunction,
    emit: (event: string, param: any) => SchedulerInstance.emit(event, param),
    shared: CloudFunction._shared_preference,
    getToken: getToken,
    parseToken: parseToken,
    mongo: {
      client: Globals.accessor.conn,
      db: Globals.accessor.db
    }
  }
  return cloud
}

export default cloud