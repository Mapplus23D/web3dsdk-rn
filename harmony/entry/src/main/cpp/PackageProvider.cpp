#include "RNOH/PackageProvider.h"
#include "generated/RNOHGeneratedPackage.h"
#include "SafeAreaViewPackage.h"
#include "GeoLocationPackage.h"
#include "RNFSPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<RNOHGeneratedPackage>(ctx),
        std::make_shared<SafeAreaViewPackage>(ctx),
        std::make_shared<GeoLocationPackage>(ctx),
        std::make_shared<RNFSPackage>(ctx),
    };
}