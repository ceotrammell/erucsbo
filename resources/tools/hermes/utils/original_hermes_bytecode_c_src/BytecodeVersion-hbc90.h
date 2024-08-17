/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_BCGEN_HBC_BYTECODEVERSION_H
#define HERMES_BCGEN_HBC_BYTECODEVERSION_H

#include <cstdint>

/*
 * This file should *only* contain the version number constant definition,
 * to enable tooling to determine whether the version has been updated.
 */

namespace hermes {
namespace hbc {

// Bytecode version generated by this version of the compiler.
// Updated: Sep 19, 2022
const static uint32_t BYTECODE_VERSION = 90;

} // namespace hbc
} // namespace hermes

#endif // HERMES_BCGEN_HBC_BYTECODEVERSION_H
