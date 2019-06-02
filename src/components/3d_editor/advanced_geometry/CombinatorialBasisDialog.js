import React from 'react';
import _ from 'underscore';
import NPMsAlert from 'react-s-alert';
import {Made} from "@exabyte-io/made.js";
import {ModalHeader, ModalBody, ModalFooter} from 'react-bootstrap';

import {Material} from "../../../material";
import {ModalDialog} from '../../include/ModalDialog';
import {displayMessage} from "../../../i18n/messages";
import BasisText from "../../source_editor/BasisText";
import {ShowIf} from "../../../utils/react/showif";

// TODO: adjust this component and SourceEditor to inherit from the same one - XYZBasisEditor

class CombinatorialBasisDialog extends ModalDialog {

    constructor(props) {
        super(props);
        this.state = {
            xyz: this.props.material.getBasisAsXyz(),
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    
    handleChange(content) {
        // update the input field immediately on typing
        this.setState({xyz: content});

    }

    assertCombinatorialBasesCount(bases) {
        const maxCombinatorialBasesCount = this.props.maxCombinatorialBasesCount;
        if (bases.length > maxCombinatorialBasesCount) {
            NPMsAlert.warning(displayMessage('combinatorialBasesCountExceeded', maxCombinatorialBasesCount));
            return false;
        }
        return true;
    }

    handleSubmit() {

        if (!this.BasisTextComponent.state.isContentValidated) return; // don't proceed if cannot validate xyz
        const _xyzText = this.state.xyz;
        const material = this.props.material;
        // TODO: avoid modifying materials directly inside this component move the below logic to reducer

        // create combinatorial set from a given basis
        const newBases = new Made.parsers.xyz.CombinatorialBasis(_xyzText).allBasisConfigs;

        if (!this.assertCombinatorialBasesCount(newBases)) return;

        const newMaterials = [];
        _.each(newBases, (elm, idx) => {
            // first set units from existing material, as allBasises() returns no units
            const latticeConfig = material.lattice;
            const lattice = new Made.Lattice(latticeConfig);
            const basisConfig = Object.assign({}, material.basis, elm);
            const basis = new Made.Basis({
                ...basisConfig,
                cell: lattice.vectorArrays
            });
            // then create material
            const newMaterialConfig = Object.assign({},
                material.toJSON(),
                {
                    basis: basis.toJSON(),
                    name: `${material.name} - ${basis.formula}`
                }
            );
            const newMaterial = new Material(newMaterialConfig);
            newMaterial.cleanOnCopy();
            newMaterials.push(newMaterial);
        });
        // pass up the chain
        this.props.onSubmit(newMaterials);
    }

    renderHeader() {
        return (
            <ModalHeader className="bgm-dark" closeButton={true}>
                <h4 className="modal-title">{this.props.title}
                    <a className="m-l-10 combinatorial-info"
                        href="https://docs.exabyte.io/materials-designer/header-menu/advanced/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i className="zmdi zmdi-info"/>
                    </a>
                </h4>
            </ModalHeader>
        )
    }

    renderBody() {
        return (
            <ModalBody className="bgm-dark">
                <BasisText
                    ref={(el) => {this.BasisTextComponent = el}}
                    className="combinatorial-basis"
                    content={this.state.xyz}
                    onChange={this.handleChange}
                />

                <div className="row m-t-10">
                    <div className="col-md-12">
                        <button id="generate-combinatorial" className="btn btn-custom btn-block"
                            onClick={this.handleSubmit}>Generate Combinatorial Set
                        </button>
                    </div>
                </div>
            </ModalBody>
        );
    }

    renderFooter() {return null}
}

CombinatorialBasisDialog.PropTypes = {
    onSubmit: React.PropTypes.func,
    material: React.PropTypes.object,
    maxCombinatorialBasesCount: React.PropTypes.number,
};

CombinatorialBasisDialog.defaultProps = {
    maxCombinatorialBasesCount: 100,
};

export default CombinatorialBasisDialog;
