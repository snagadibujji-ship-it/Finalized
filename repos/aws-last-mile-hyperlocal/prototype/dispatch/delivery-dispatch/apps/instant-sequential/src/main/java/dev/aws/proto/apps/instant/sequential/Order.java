/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package dev.aws.proto.apps.instant.sequential;

import dev.aws.proto.core.routing.location.CoordinateWithId;
import lombok.Data;

import java.util.List;

/**
 * Represents an Order in the instant-sequential delivery domain.
 */
@Data
public class Order extends dev.aws.proto.core.Order {

    /**
     * Represents the pickup location for the Order.
     */
    @Data
    public static class Origin extends CoordinateWithId {
        private int preparationTimeInMins;
        private List<String> tags;
    }

    /**
     * The dropoff point for the order.
     */
    private CoordinateWithId destination;

    /**
     * The pickup point for the order.
     */
    private Origin origin;

    /**
     * Short form of the ID.
     *
     * @return First 8 chars of the order ID.
     */
    public String getShortId() {
        return this.getOrderId().substring(0, 8);
    }
}
