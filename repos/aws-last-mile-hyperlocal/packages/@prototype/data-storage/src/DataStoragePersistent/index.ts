/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                               *
 *                                                                                                                   *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of                                  *
 *  this software and associated documentation files (the "Software"), to deal in                                    *
 *  the Software without restriction, including without limitation the rights to                                     *
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of                                 *
 *  the Software, and to permit persons to whom the Software is furnished to do so.                                  *
 *                                                                                                                   *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR                                       *
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS                                 *
 *  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR                                   *
 *  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER                                   *
 *  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN                                          *
 *  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                                       *
 *********************************************************************************************************************/
import { Construct } from 'constructs'
import { NestedStack, NestedStackProps, aws_ssm as ssm } from 'aws-cdk-lib'
import { RootDataStorage } from './RootDataStorage'
import { InstantDeliveryDataStorage } from './InstantDeliveryDataStorage'
import { LocationServiceDataStorage } from './LocationServiceDataStorage'
import { SameDayDeliveryDataStorage } from './SamedayDeliveryDataStorage'
import { DataStorageProps } from './util/DataStorageConstruct'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataStoragePersistentProps extends NestedStackProps {
	readonly parameterStoreKeys: Record<string, string>
	readonly country: string
}

export class DataStoragePersistent extends NestedStack {
	public readonly ssmStringParameters: Record<string, ssm.IStringParameter>

	public readonly rootDataStorage: RootDataStorage

	public readonly locationServiceDataStorage: LocationServiceDataStorage

	public readonly instantDeliveryDataStorage: InstantDeliveryDataStorage

	public readonly sameDayDeliveryDataStorage: SameDayDeliveryDataStorage

	constructor (scope: Construct, id: string, props: DataStoragePersistentProps) {
		super(scope, id, props)

		const { country, parameterStoreKeys } = props

		this.ssmStringParameters = {}

		const dataStorageProps: DataStorageProps = {
			parameterStoreKeys,
			country,
			ssmStringParameters: this.ssmStringParameters,
			removalPolicy: props.removalPolicy,
		}

		this.rootDataStorage = new RootDataStorage(this, 'RootDataStorage', dataStorageProps)
		this.locationServiceDataStorage = new LocationServiceDataStorage(this, 'LocationServiceDataStorage', dataStorageProps)
		this.instantDeliveryDataStorage = new InstantDeliveryDataStorage(this, 'InstantDeliveryDataStorage', dataStorageProps)
		this.sameDayDeliveryDataStorage = new SameDayDeliveryDataStorage(this, 'SameDayDeliveryDataStorage', dataStorageProps)

		// seed DB if necessary
		this.rootDataStorage.runDbSeed()
		this.locationServiceDataStorage.runDbSeed()
		this.instantDeliveryDataStorage.runDbSeed()
		this.sameDayDeliveryDataStorage.runDbSeed()
	}
}
