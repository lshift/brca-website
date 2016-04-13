// A table for variants.
//
// The intent here was to split the generic table code
// in DataTable from the variant domain knowledge, which
// would be here. That division has broken down due to
// peculiarities of react-data-components DataMixin, and
// time pressure. Knowledge about variants is in both files.
// This needs to be revisited.

/*global module: false, require: false, window: false */
'use strict';

var React = require('react');
var PureRenderMixin = require('./PureRenderMixin');
var DataTable = require('./DataTable');
var _ = require('underscore');
var {Col, Row, Panel, Button, Input} = require('react-bootstrap');
var ColumnCheckbox = require('./ColumnCheckbox');


require('react-data-components-bd2k/css/table-twbs.css');

function buildHeader(onClick, title) {
    return (
        <span>
            {title}
            <span onClick={ev => {ev.stopPropagation(); onClick(title); }}
                  className='help glyphicon glyphicon-question-sign superscript'/>
        </span>
    );
}

//function renderClinVarLink(val) {
//    return (
//        <a title="View on ClinVar"
//            onClick={ev => ev.stopPropagation()}
//            href={"http://www.ncbi.nlm.nih.gov/clinvar/?term=" + val}>{val}</a>
//    );
//}

function renderCell(val) {
    return <span>{val}</span>;
}

var filterColumns = [
    {name: 'Gene', prop: 'Gene_Symbol', values: ['BRCA1', 'BRCA2']},
//    {name: 'Exon', values: ['Any', 1, 2, 3, 4, 5]}, // XXX needs refgene to get exon count
    {name: 'Pathogenicity', prop: 'Cat_Dis', values: ['Pathogenic', 'Benign', 'Unknown']}
];

// XXX duplicate this functionality on the server, perhaps
// by having the client pass in order_by of Genomic_Coordinate
// for hgvs columns.
//var strPropCmpFn = prop => (a, b) => {
//    var ap = a[prop],
//        bp = b[prop];
//    if (ap == null && bp == null || ap === bp) {
//        return 0;
//    }
//    if (bp == null || bp < ap) {
//        return 1;
//    }
//    return -1;
//};
//
//var posCmpFn = strPropCmpFn('Genomic_Coordinate');
//
//function sortColumns(columns, {prop, order}, data) {
//    var sortFn = _.findWhere(columns, {prop: prop}).sortFn || strPropCmpFn(prop),
//        sorted = data.slice(0).sort(sortFn);
//    if (order === 'descending') {
//        sorted.reverse();
//    }
//    return sorted;
//}

var columns = [
    {title: 'Locus', prop: 'Locus'},
    {title: 'Transcript', prop: 'Transcript'},
    {title: 'Allele', prop: 'Allele'},
    {title: 'DNA', prop: 'DNA'},
    {title: 'AA', prop: 'AA'},
    {title: 'Genome Build', prop: 'Genome_Build'},
    {title: 'Chromosome', prop: 'Chromosome'},
    {title: 'Genome Build DNA', prop: 'Genome_Build_DNA'},
    {title: 'Report As Allele', prop: 'Report_As_Allele'},
    {title: 'Report As DNA', prop: 'Report_As_DNA'},
    {title: 'Report As AA', prop: 'Report_As_AA'},
    {title: 'Region', prop: 'Region'},
    {title: 'Cat (Dis)', prop: 'Cat_Dis'},
    {title: 'Non-inc Dis', prop: 'Non_inc_Dis'},
    {title: 'Rpt', prop: 'Rpt'},
    {title: 'Fam', prop: 'Fam'},
    {title: 'DNA Type', prop: 'DNA_Type'},
    {title: 'AA Type', prop: 'AA Type'},
    {title: 'Cyto Type', prop: 'Cyto_Type'},
    {title: 'RS#', prop: 'RS'},
    {title: 'ClinVar', prop: 'ClinVar'},
    {title: 'Source', prop: 'Source'},
    {title: 'Alias(es)', prop: 'Alias_es'},
    {title: 'Ref', prop: 'Ref'},
];

var research_mode_columns = columns;

var subColumns = _.map(columns, (c => {c.render = renderCell; return c;}));

var defaultColumns = ['Locus', 'Transcript', 'Allele', 'DNA', 'AA'];
var defaultResearchColumns = ['Locus', 'Transcript', 'Allele', 'DNA', 'AA'];

// Work-around to allow the user to select text in the table. The browser does not distinguish between
// click and drag: if mouseup and mousedown occur on the same element, a click event is fired even if
// the events occur at very different locations. That makes it hard to select text. This workaround
// defeats the click event if text has been selected.
//
// XXX getSelection().isCollapsed is not available on all platforms. On those platforms we
// will always return false (no selection), so the row click will fire. This makes it hard
// for the user to select text in the table. A better solution would be to add a polyfill for
// getSelection and isCollapsed. There are a few available, though they are much larger than
// what we require:
// https://github.com/Modernizr/Modernizr/wiki/HTML5-Cross-Browser-Polyfills#dom-range-and-selection
// We might want to write a minimal isCollapsed that will use whichever DOM method is available. We could
// also add feature detection, and modify the UI if the feature is not available. E.g. we could style the
// text areas to look clickable instead of selectable..
var hasSelection = () => !(window.getSelection && window.getSelection().isCollapsed);

var Table = React.createClass({
    mixins: [PureRenderMixin],
    render: function () {
        var {data, onHeaderClick, onRowClick, hiddenSources,...opts} = this.props;
        return (
            <DataTable
                ref='table'
                className='row-clickable'
                {...opts}
                buildRowOptions={r => ({title: 'click for details', onClick: () => hasSelection() ? null : onRowClick(r)})}
                buildHeader={title => buildHeader(onHeaderClick, title)}
                onRowClick={onRowClick}
                onHeaderClick={onHeaderClick}
                filterColumns={filterColumns}
                initialData={data}
                initialPageLength={20}
                pageLengthOptions={[ 20, 50, 100 ]}/>
        );
    }
});

var ResearchVariantTableSupplier = function (Component) {
    var ResearchVariantTableComponent = React.createClass({
        mixins: [PureRenderMixin],

        getInitialState: function () {
            var defaultColumnSelection = _.object(
                _.map(this.getColumns(),
                    c => _.contains(this.getDefaultColumns(), c.prop) ? [c.prop, true] : [c.prop, false]));
            var columnSelectionQueryParams = this.props.initialState.columnSelection;

            return {
                columnSelection: {...defaultColumnSelection, ...columnSelectionQueryParams}
            };
        },
        toggleColumns: function (prop) {
            var {columnSelection} = this.state,
                val = columnSelection[prop],
                cs = {...columnSelection, [prop]: !val};
            this.setState({columnSelection: cs});
        },
        filterFormCols: function (subColList, columnSelection) {
            return _.map(subColList, ({title, prop}) =>
                <ColumnCheckbox onChange={v => this.toggleColumns(prop)} key={prop} label={prop} title={title}
                                initialCheck={columnSelection}/>);
        },
        getAdvancedFilters() {
            var cols = this.filterFormCols(subColumns, this.state.columnSelection);
            var filterFormSubCols = _.map(cols, (c) => <Col sm={3}>{c}</Col>);

            return (<label className='control-label'>
                <Panel className="top-buffer" header="Column Selection">
                    {filterFormSubCols}
                </Panel>
            </label>);
        },
        getDownloadButton: function (callback) {
            return <Button className="btn-sm rgt-buffer" download="variants.csv" href={callback()}>Download</Button>;
        },

        getColumns: function () {
            return research_mode_columns;
        },
        getDefaultColumns: function () {
            return defaultResearchColumns;
        },
        render: function () {
            var columnSelection = this.state.columnSelection;
            return (
                <Component
                    {...this.props}
                    columns={this.getColumns()}
                    advancedFilters={this.getAdvancedFilters()}
                    columnSelection={columnSelection}
                    downloadButton={this.getDownloadButton}
                    lollipopButton={()=> null}/>
            );
        }
    });
    return ResearchVariantTableComponent;
};

var VariantTableSupplier = function (Component) {
    var ResearchVariantTableComponent = React.createClass({
        mixins: [PureRenderMixin],
        getColumns: function () {
            return columns;
        },
        getDefaultColumns: function () {
            return defaultColumns;
        },
        render: function () {
            var columnSelection = _.object(
                _.map(this.getColumns(),
                    c => _.contains(this.getDefaultColumns(), c.prop) ? [c.prop, true] : [c.prop, false]));
            return (
                <Component
                    {...this.props}
                    columns={this.getColumns()}
                    columnSelection={columnSelection}
                    downloadButton={()=> null}
                    lollipopButton={()=> null}/>
            );
        }
    });
    return ResearchVariantTableComponent;
};


module.exports = ({
    VariantTable: VariantTableSupplier(Table),
    ResearchVariantTable: ResearchVariantTableSupplier(Table),
    research_mode_columns: research_mode_columns,
    columns: columns
});
