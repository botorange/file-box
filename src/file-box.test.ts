#!/usr/bin/env ts-node

import * as assert from 'assert'

import 'reflect-metadata'

// tslint:disable:no-shadowed-variable
import * as test  from 'blue-tape'
// import * as sinon from 'sinon'
import { FileBox } from './file-box'

const requiredMetadataKey = Symbol('required')

const tstest = {
  methodFixture() {
    return function (
      ..._: any[]
      // target      : Object,
      // propertyKey : string,
      // descriptor  : PropertyDescriptor,
    ) {
      console.log('@fixture()')
    }
  },
  classFixture() {
    return function (constructor: Function) {
      console.log(constructor.name)
      console.log(constructor.prototype.name)
    }
  },
  parameterFixture() {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
      console.log(propertyKey)
      const existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
      existingRequiredParameters.push(parameterIndex)
      Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey)
    }
  },
}

test('File smoke testing', async t => {
  const box = FileBox.fromLocal('x')
  t.ok(box)
})

@tstest.classFixture()
export class FixtureFileBox {

  @tstest.methodFixture()
  public static localFileFixutre() {
    return {
      name: 'test.txt',
      type: 'plain/text',
      size: '1',
      content: 'T',
    }
  }

}

export class TestFileBox {

  public static testFileCreateLocal(
    @tstest.parameterFixture() localFileFixture: any,
  ) {
    const file = FileBox.fromLocal(localFileFixture)

    test('File.createLocal()', async t => {
      t.ok(file, 'ok')

    })

    test('File.fromRemote()', async t => {
      const URL = 'http://httpbin.org/response-headers?Content-Type=text/plain;%20charset=UTF-8&Content-Disposition=attachment;%20filename%3d%22test.json%22'
      assert(URL)
      t.pass('ok')
    })

  }

}

test('toBase64()', async t => {
  const BASE64_DECODED = 'FileBoxBase64\n'
  const BASE64_ENCODED = 'RmlsZUJveEJhc2U2NAo='

  const fileBox = FileBox.fromBase64(BASE64_ENCODED, 'test.txt')
  const base64 = await fileBox.toBase64()

  t.equal(base64, BASE64_ENCODED, 'should get base64 back')

  const text = Buffer.from(base64, 'base64').toString()
  t.equal(text, BASE64_DECODED, 'should get the text right')
})

test('syncRemoteName()', async t => {
  const URL = 'http://httpbin.org/response-headers?Content-Disposition=attachment;%20filename%3d%22test.txt%22&filename=test.txt'

  const EXPECTED_NAME_FROM_URL    = 'response-headers?Content-Disposition=attachment;%20filename%3d%22test.txt%22&filename=test.txt'
  const EXPECTED_TYPE_FROM_URL    = 'text/plain'

  const EXPECTED_NAME_FROM_HEADER = 'test.txt'
  const EXPECTED_TYPE_FROM_HEADER = 'application/json'

  const fileBox = FileBox.fromRemote(URL)

  t.equal(fileBox.name, EXPECTED_NAME_FROM_URL, 'should get the name from url')
  t.equal(fileBox.mimeType, EXPECTED_TYPE_FROM_URL, 'should get the mime type from url')

  await fileBox.syncRemoteName()

  t.equal(fileBox.name, EXPECTED_NAME_FROM_HEADER, 'should get the name from remote header')
  t.equal(fileBox.mimeType, EXPECTED_TYPE_FROM_HEADER, 'should get the mime type from remote http header')
})

test('toDataURL()', async t => {
  const FILE_PATH         = 'tests/fixtures/hello.txt'
  const EXPECTED_DATA_URL = 'data:text/plain;base64,d29ybGQK'

  const fileBox = FileBox.fromFile(FILE_PATH)

  const dataUrl = await fileBox.toDataURL()

  t.equal(dataUrl, EXPECTED_DATA_URL, 'should get the data url right')
})

test('toString()', async t => {
  const FILE_PATH     = 'tests/fixtures/hello.txt'
  const EXPECT_STRING = 'FileBox#Local<hello.txt>'

  const fileBox = FileBox.fromFile(FILE_PATH)
  t.equal(fileBox.toString(), EXPECT_STRING, 'should get the toString() result')
})
